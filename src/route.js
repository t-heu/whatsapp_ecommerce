const express = require("express");

const v1Router = express.Router();

const { io } = require("./server");
const { sendMessage, sendInteractiveMessage } = require("./api/whatsapp");
const { set, ref, database, remove, update, get, push } = require("./api/firebase");
const { resetTimeout, startTimeout } = require("./utils/autoCloseSession");
const { suggestComplement } = require("./utils/upsellAI");
const messages = require("./messages.json");

const { suggests, purchaseKeywords, flowSteps } = messages.config;

v1Router.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) return res.status(400).json({ error: "Dados inválidos" });

  const snapshot = await get(ref(database, `zero/chats/${number}`));
  let clientState = snapshot.val();

  if (!clientState || !clientState.client) {
    return res.status(404).json({ error: "Cliente não encontrado/Ou saiu" });
  }

  await sendMessage(number, message);

  const newMessage = { sender: "Você", text: message };
  const messagesRef = ref(database, `zero/chats/${number}/client/messages`);
  push(messagesRef, newMessage);
    
  res.sendStatus(200);
});

v1Router.get("/chat/:number", async (req, res) => {
  const number = req.params.number;

  const snapshot = await get(ref(database, `zero/chats/${number}`));

  if (!snapshot.exists()) return []

  const {client} = snapshot.val();

  if (!client) return res.status(400).json({ error: "errr" });
  
  res.render("chat", { 
    messages: client.messages || [],
    number,
    name: client.name
  });
});

v1Router.get("/", (req, res) => {
  res.render("login"); // Adicionando messages para evitar erro
});

v1Router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const snapshot = await get(ref(database, `zero/users/${username}`));
  const data = snapshot.val();
  
  if (data && data.password === password) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: "Usuário ou senha incorretos!" });
  }
});

v1Router.get("/home", async (req, res) => {
  const snapshot = await get(ref(database, 'zero/chats'));

  if (!snapshot.exists()) {
    return []
  }
  const clientsInService = Object.values(snapshot.val()).filter(client => client.inService);
  
  res.render("home", { queue: clientsInService, messages: [] }); // Adicionando messages para evitar erro
});

v1Router.post("/pay", async (req, res) => {
  const { number } = req.body;
  const updates = {};

  if (!number) return res.status(400).json({ error: "Número não fornecido" });

  await sendInteractiveMessage(number, "Escolha a forma de pagamento via PIX:", [
    "QR Code 📸",
    "CNPJ 🏢",
    "Pix Copia e Cola 📋",
  ]);

  updates['zero/chats/' + number + '/inService'] = false;
  updates['zero/chats/' + number + '/step'] = "Escolha a forma de pagamento via PIX:"
  update(ref(database), updates);

  return res.sendStatus(200);
});

v1Router.post("/end", async (req, res) => {
  const { number } = req.body;

  await sendMessage(number, messages.obrigado);
  remove(ref(database, 'zero/chats/' + number))

  return res.sendStatus(200);
});

v1Router.post("/attend", async (req, res) => {
  const { number, seller } = req.body;
  const updates = {};

  const snapshot = await get(ref(database, `zero/chats/${number}`));
  
  if (!snapshot.exists()) return []

  const {client} = snapshot.val();

  if (!client) {
    return res.status(404).json({ e: "Cliente não encontrado"});
  }
  
  if (!client.seller) {
    updates['zero/chats/' + number + '/client/seller'] = seller;
    update(ref(database), updates);
    return res.sendStatus(200);
  }

  if (client.seller !== seller) {
    return res.status(404).json({ e: "Cliente já atribuído a outro vendedor" });
  }
  
  if (client.seller === seller) {
    return res.sendStatus(200);
  }

  return res.sendStatus(200);
});

// Webhook para receber mensagens
v1Router.post("/webhook", async (req, res) => {
  const updates = {};
  const body = req.body;
  if (!body.object) return res.sendStatus(404);

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);

  const name = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0].profile?.name;
  const from = message.from;
  const text = message.text?.body?.toLowerCase();
  const button_id = message.interactive?.button_reply.id;
  const button_title = message.interactive?.button_reply.title;
  const button_key = `${button_id}_${button_title}`;

  if (text?.length > 500) return res.sendStatus(400); // Evita mensagens muito longas  
  if (!/^[a-zA-Z0-9\s!?.,]+$/.test(text)) return res.sendStatus(400); // Permite apenas caracteres seguros  

  const snapshot = await get(ref(database, `zero/chats/${number}`));
  let clientState = snapshot.val();

  resetTimeout(from);

  if (text && suggests.some(item => text.includes(item))) {
    const foundKeyword = purchaseKeywords.find(keyword => text.includes(keyword));

    if (foundKeyword) {
      const complement = await suggestComplement(text);
      await sendMessage(from, `Antes de te passar ${foundKeyword}, que tal levar também ${complement}?`);
      return res.sendStatus(200);
    }
  }

  // 🚫 Se o cliente está em atendimento humano, não interagir
  if (clientState.inService) {
    io.emit("receiveMessage", { number: from, name, message: text });
    
    const newMessage = { sender: name, text };
    const messagesRef = ref(database, `zero/chats/${from}/client/messages`);
    push(messagesRef, newMessage);

    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientState.step) {
    await sendInteractiveMessage(from, `${messages.inicio_1} ${name}! ${messages.inicio_2}`, flowSteps["Inicio"]);

    await set(ref(database, 'zero/chats/' + from), {
      step: "Inicio",
      inService: false,
      client: {
        number: from,
        name,
        seller: '',
        messages: []
      }
    })

    startTimeout(from);
    return res.sendStatus(200);
  }

  // Se quiser encerrar a conversa
  if (text?.includes("encerrar")) {
    await sendMessage(from, messages.encerrar);
    remove(ref(database, 'zero/chats/' + from))
    return res.sendStatus(200);
  }

  // 🚫 Impede escolhas fora do fluxo esperado
  if (!flowSteps[clientState.step]?.includes(button_title)) {
    await sendMessage(from, messages.fluxo_invalido);
    return res.sendStatus(200);
  }

  // ✅ Agora podemos registrar a nova escolha
  updates['zero/chats/' + from + '/step'] = button_title;

  const actions = {
    "btn_0_Consultar orçamento": async () => {
      await sendMessage(from, messages.consultar_orcamento);
      updates['zero/chats/' + from + '/inService'] = true;
    },
    "btn_1_FAQ": async () => {
      await sendInteractiveMessage(from, messages.faq_opcoes, flowSteps["FAQ"]);
    },
    "btn_0_Horário de funci.": async () => {
      await sendMessage(from, messages.horario_funcionamento);
      remove(ref(database, 'zero/chats/' + from))
    },
    "btn_1_Formas de pagamento": async () => {
      await sendMessage(from, messages.formas_pagamento);
      remove(ref(database, 'zero/chats/' + from))
    },
    "btn_0_QR Code 📸": async () => {
      await sendMessage(from, messages.pagamento_qr);
      await sendMessage(from, messages.confirmacao_pagamento);
      updates['zero/chats/' + from + '/inService'] = true;
    },
    "btn_1_CNPJ 🏢": async () => {
      await sendMessage(from, messages.pagamento_cnpj);
      await sendMessage(from, messages.confirmacao_pagamento);
      updates['zero/chats/' + from + '/inService'] = true;
    },
    "btn_2_Pix Copia e Cola 📋": async () => {
      await sendMessage(from, messages.pagamento_pix);
      await sendMessage(from, messages.confirmacao_pagamento);
      updates['zero/chats/' + from + '/inService'] = true;
    }
  };

  if (actions[button_key]) {
    await actions[button_key]();
  }

  update(ref(database), updates);
  res.sendStatus(200);
});

// Webhook de verificação do WhatsApp
v1Router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN_SECRET;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = { v1Router };
