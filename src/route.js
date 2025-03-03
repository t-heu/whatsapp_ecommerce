const express = require("express");

const v1Router = express.Router();

const rateLimit = require("./middlewares/rateLimit");
const { io } = require("./server");
const isAuthenticated = require("./middlewares/isAuthenticated");
const isLogged = require("./middlewares/isLogged");
const { sendMessage, sendInteractiveMessage } = require("./api/whatsapp");
const { set, ref, database, remove, update, get, push } = require("./api/firebase");
const { resetTimeout, startTimeout, stopTimeout } = require("./utils/autoCloseSession");
const chatController = require("./controllers/chatController");
const { getFlowConfig } = require("./utils/configLoader");
const handleVehicleInquiry = require("./utils/handleVehicleInquiry");

v1Router.get("/", isLogged, chatController.home);
v1Router.get("/signup", isLogged, chatController.signup);
v1Router.post("/signup", isLogged, rateLimit, chatController.createUser);
v1Router.get("/login", isLogged, chatController.login);
v1Router.post("/login", isLogged, rateLimit, chatController.authenticateUser);
v1Router.post("/logout", isAuthenticated, chatController.logout);
v1Router.post("/send", isAuthenticated, chatController.sendMessageToClient);
v1Router.get("/chat/:number", isAuthenticated, chatController.getChat);
v1Router.get("/panel", isAuthenticated, chatController.getPanel);
v1Router.post("/pay", isAuthenticated, chatController.processPayment);
v1Router.post("/end", isAuthenticated, chatController.endChat);
v1Router.post("/attend", isAuthenticated, chatController.attendClient);

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
  const button_title = message.interactive?.button_reply.title;
  //const button_id = message.interactive?.button_reply.id;
  //const button_key = `${button_id}_${button_title}`;

  if (text?.length > 500) return res.sendStatus(400); // Evita mensagens muito longas  
  if (!/^[a-zA-Z0-9\s!?.,]+$/.test(text)) return res.sendStatus(400); // Permite apenas caracteres seguros  

  const snapshot = await get(ref(database, `zero/chats/${from}`));
  let clientState = snapshot.val();

  resetTimeout(from);

  const empresa = "empresa_x"; // Defina isso dinamicamente se necessário
  const flow = getFlowConfig(empresa);

  if (clientState && clientState.step === "Inicio" && text) {
    const resFind = await handleVehicleInquiry(text);

    if (resFind) {
      const newMessage = { sender: name, text };
      const newMessage2 = { sender: "Você", text: resFind };
      const messagesRef = ref(database, `zero/chats/${from}/client/messages`);
      push(messagesRef, newMessage);
      push(messagesRef, newMessage2);
      
      await sendMessage(from, resFind);
      return res.sendStatus(200);
    }
  }

  // 🚫 Se o cliente está em atendimento humano, não interagir
  if (clientState && clientState.inService) {
    io.emit("receiveMessage", { number: from, name, message: text });
    
    const newMessage = { sender: name, text };
    const messagesRef = ref(database, `zero/chats/${from}/client/messages`);
    push(messagesRef, newMessage);

    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientState || !clientState.step) {
    await sendInteractiveMessage(from, `${flow["Inicio"].text[0]} ${name}! ${flow["Inicio"].text[1]}`, flow["Inicio"].buttons[0].opcoes);

    await set(ref(database, 'zero/chats/' + from), {
      step: "Inicio",
      inService: false,
      client: {
        number: from,
        name,
        seller: '',
        messages: new Array()
      }
    })

    startTimeout(from);
    return res.sendStatus(200);
  }

  // Se quiser encerrar a conversa
  if (text?.includes("encerrar")) {
    await sendMessage(from, flow.endchat[0]);
    remove(ref(database, 'zero/chats/' + from));
    stopTimeout(from);
    return res.sendStatus(200);
  }

  // 🚫 Impede escolhas fora do fluxo esperado
  if (!flow[clientState.step] || !flow[clientState.step].buttons?.[0].opcoes.includes(button_title)) {
    await sendMessage(from, flow.invalid[0]);
    return res.sendStatus(200);
  }

  const nextStep = flow[button_title];

  if (nextStep.type === "text") {
    nextStep.text.forEach(async (textArr) => await sendMessage(from, textArr));
    if (nextStep.inAttendance) updates['zero/chats/' + from + '/inService'] = true;
    if (nextStep.endchat) {
      remove(ref(database, 'zero/chats/' + from));
      stopTimeout(from);
    }
  } else if (nextStep.type === "botao") {
    updates[`zero/chats/${from}/step`] = button_title;
    if (nextStep.inAttendance) updates['zero/chats/' + from + '/inService'] = true;
    await sendInteractiveMessage(from, nextStep.text[0], nextStep.buttons[0].opcoes);
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

v1Router.use((req, res) => res.status(404).render("404", { title: "Página Não Encontrada" }));

module.exports = { v1Router };
