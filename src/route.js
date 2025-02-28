const express = require("express");

const v1Router = express.Router();

const { io } = require("./server");
const { sendMessage, sendInteractiveMessage } = require("./service");
const { resetTimeout, startTimeout } = require("./utils/autoCloseSession");
const { clientsData } = require("./utils/config");
const messages = require("./messages.json");
const { suggestComplement } = require("./utils/upsellAI");


const suggests = ["pastilha de freio", "pastilhas", "past. freio", "disco de freio", "disco", "fluido de freio",
  "amortecedor", "amort.", "mola", "molas", "coifa", "batente","bucha", "pivô", "bieleta", "correia dentada", "tensor", "vela de ignição", "bobina de ignição", "bomba de óleo", "cárter",
  "embreagem", "kit de embreagem", "cabo de embreagem", "eixo homocinético", "semi-eixo",
  "radiador", "ventoinha", "bomba d'água", "mangueira do radiador", "válvula termostática",
  "bateria", "alternador", "motor de partida", "velas", "bobina", "fusível", "relé",
  "caixa de direção", "barra de direção", "ponta de eixo", "bomba hidráulica", "fluido de direção",
  "pneu", "pneus", "calota", "aro", "câmara de ar", "estepe", "válvula de ar","para-lama", "paralama", "para-barro", "capô", "parachoque", "porta-malas", "retrovisor",
  "catalisador", "silencioso", "tubo de escape", "coletor de escape", "flexível de escapamento"
];

const purchaseKeywords = ["preço", "valor", "quanto", "compra", "orçamento"];

const flowSteps = {
  "Inicio": ["Consultar orçamento", "FAQ"],
  "Consultar orçamento": [],
  "FAQ": ["Horário de funci.", "Formas de pagamento"],
  "Horário de funci.": [],
  "Formas de pagamento": [],
  "Escolha a forma de pagamento via PIX:": ["QR Code 📸", "CNPJ 🏢", "Pix Copia e Cola 📋",]
};

clientsData.set("55999999999", { 
  step: "Inicio", 
  inService: true,
  client: { 
    number: "55999999999", 
    name: "Test", 
    seller: '' ,
    messages: [
      { sender: "Test", text: "OI" },
      { sender: "Você", text: "Eai" }
    ]
  }
});

v1Router.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) return res.status(400).json({ error: "Dados inválidos" });

  const clientState = clientsData.get(number);

  if (!clientState || !clientState.client) {
    return res.status(404).json({ error: "Cliente não encontrado/Ou saiu" });
  }

  clientState.client.messages.push({ sender: "Você", text: message });
  clientsData.set(number, clientState);

  await sendMessage(number, message);
  
  res.sendStatus(200);
});

v1Router.get("/chat/:number", (req, res) => {
  const number = req.params.number;
  const clientState = clientsData.get(number);

  if (!clientState) return res.status(400).json({ error: "errr" });
  
  res.render("chat", { 
    messages: clientState.client.messages || [],
    number
  });
});

v1Router.get("/home", (req, res) => {
  const clientsInService = Array.from(clientsData.values()).filter(clientState => clientState.inService);
  res.render("home", { queue: clientsInService });
});

v1Router.post("/pay", async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: "Número não fornecido" });

  let clientState = clientsData.get(number);

  await sendInteractiveMessage(number, "Escolha a forma de pagamento via PIX:", [
    "QR Code 📸",
    "CNPJ 🏢",
    "Pix Copia e Cola 📋",
  ]);

  clientState.inService = false;
  clientState.step = "Escolha a forma de pagamento via PIX:";
  clientsData.set(number, clientState);

  return res.sendStatus(200);
});

v1Router.post("/end", async (req, res) => {
  const { number } = req.body;

  await sendMessage(number, messages.obrigado);
  clientsData.delete(number);

  return res.sendStatus(200);
});

v1Router.post("/attend", async (req, res) => {
  const { number, seller } = req.body;
  const clientState = clientsData.get(number);

  if (!clientState) {
    console.log(`Cliente com número ${number} não encontrado.`);
    return res.status(404).json({ e: "Cliente não encontrado"});
  }

  if (clientState.client.seller && clientState.client.seller !== seller) {
    return res.status(404).json({ e: "Cliente já atribuído a outro vendedor" });
  }

  clientState.client.seller = seller;
  clientsData.set(number, clientState);

  return res.sendStatus(200);
});

// Webhook para receber mensagens
v1Router.post("/webhook", async (req, res) => {
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

  let clientState = clientsData.get(from) || { step: null, inService: false };

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

    clientState.client.messages.push({ sender: name, text });
    clientsData.set(from, clientState);
    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientState.step) {
    await sendInteractiveMessage(from, `${messages.inicio_1} ${name}! ${messages.inicio_2}`, flowSteps["Inicio"]);

    clientsData.set(from, { 
      step: "Inicio", 
      inService: false,
      client: {
        number: from,
        name,
        seller: '',
        messages: []
      }
    });
    startTimeout(from);
    return res.sendStatus(200);
  }

  // Se quiser encerrar a conversa
  if (text?.includes("encerrar")) {
    await sendMessage(from, messages.encerrar);
    clientsData.delete(from);
    return res.sendStatus(200);
  }

  // 🚫 Impede escolhas fora do fluxo esperado
  if (!flowSteps[clientState.step]?.includes(button_title)) {
    await sendMessage(from, messages.fluxo_invalido);
    return res.sendStatus(200);
  }

  // ✅ Agora podemos registrar a nova escolha
  clientState.step = button_title;
  clientsData.set(from, clientState);

  const actions = {
    "btn_0_Consultar orçamento": async () => {
      await sendMessage(from, messages.consultar_orcamento);
      clientState.inService = true;
      clientsData.set(from, clientState);
    },
    "btn_1_FAQ": async () => {
      await sendInteractiveMessage(from, messages.faq_opcoes, flowSteps["FAQ"]);
    },
    "btn_0_Horário de funci.": async () => {
      await sendMessage(from, messages.horario_funcionamento);
      clientsData.delete(from);
    },
    "btn_1_Formas de pagamento": async () => {
      await sendMessage(from, messages.formas_pagamento);
      clientsData.delete(from);
    },
    "btn_0_QR Code 📸": async () => {
      await sendMessage(from, messages.pagamento_qr);
      await sendMessage(from, messages.confirmacao_pagamento);
      clientState.inService = true;
      clientsData.set(from, clientState);
    },
    "btn_1_CNPJ 🏢": async () => {
      await sendMessage(from, messages.pagamento_cnpj);
      await sendMessage(from, messages.confirmacao_pagamento);
      clientState.inService = true;
      clientsData.set(from, clientState);
    },
    "btn_2_Pix Copia e Cola 📋": async () => {
      await sendMessage(from, messages.pagamento_pix);
      await sendMessage(from, messages.confirmacao_pagamento);
      clientState.inService = true;
      clientsData.set(from, clientState);
    }
  };

  if (actions[button_key]) {
    await actions[button_key]();
  }
    
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
