const { get, ref, push, update, remove, database } = require("../api/firebase");
const { sendMessage, sendInteractiveMessage } = require("../api/whatsapp");
const { getChatFlow } = require("../utils/flowConfig");
const { clearUserTimeout } = require("../utils/timeoutManager");

const flow = getChatFlow("empresa_x");

const sendMessageToClient = async (req, res) => {
  try {
    const { number, message } = req.body;
    const { company } = req.session.seller;

    if (!number || !message) {
      return res.status(400).json({ error: "Número e mensagem são obrigatórios." });
    }

    const snapshot = await get(ref(database, `autobot/users/${company}/company/chats/${number}`));
    const clientState = snapshot.val();

    if (!clientState || !clientState.client) {
      return res.status(404).json({ error: "Cliente não encontrado ou saiu." });
    }

    await sendMessage(number, message);

    const newMessage = { sender: "Você", text: message };
    await push(ref(database, `autobot/users/${company}/company/chats/${number}/client/messages`), newMessage);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const getChat = async (req, res) => {
  try {
    const { number } = req.params;
    const { company } = req.session.seller;
    const snapshot = await get(ref(database, `autobot/users/${company}/company/chats/${number}`));

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Chat não encontrado." });
    }
    
    const { client } = snapshot.val();
    
    return res.status(200).json({
      messages: client.messages || [],
      number,
      name: client.name
    });
  } catch (error) {
    console.error("Erro ao obter chat:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const getPanel = async (req, res) => {
  try {
    const { username, company } = req.session.seller;
    const snapshot = await get(ref(database, `autobot/users/${company}/company/chats`));
    
    if (!snapshot.exists()) {
      return res.render("sellers/panel", { queue: [] });
    }
    
    const clientsInService = Object.values(snapshot.val()).filter(client => client.inService);
    return res.render("sellers/panel", { queue: clientsInService, username, number: '' });
  } catch (error) {
    console.error("Erro ao obter painel:", error);
    return res.status(500).render("sellers/panel", { queue: [], username: "" });
  }
};

const processPayment = async (req, res) => {
  try {
    const { number } = req.body;
    const { company } = req.session.seller;
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    const nextStep = flow["Escolha a forma de pagamento via PIX:"];
    await sendInteractiveMessage(number, nextStep.text, nextStep.buttons);
    
    await update(ref(database), {
      [`autobot/users/${company}/company/chats/${number}/inService`]: false,
      [`autobot/users/${company}/company/chats/${number}/step`]: "Escolha a forma de pagamento via PIX:"
    });
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const endChat = async (req, res) => {
  try {
    const { number } = req.body;
    const { company } = req.session.seller;
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    await sendMessage(number, flow.messages.thanks);
    await remove(ref(database, `autobot/users/${company}/company/chats/${number}`));
    clearUserTimeout(number);
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao encerrar chat:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const attendClient = async (req, res) => {
  try {
    const { number } = req.body;
    const { company, username } = req.session.seller;
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    const snapshot = await get(ref(database, `autobot/users/${company}/company/chats/${number}`));
    
    if (!snapshot.exists() || !snapshot.val()?.client) {
      return res.status(404).json({ error: "Chat ou cliente não encontrado." });
    }
    
    const { client } = snapshot.val();
    
    if (!client.seller) {
      await update(ref(database), {
        [`autobot/users/${company}/company/chats/${number}/client/seller`]: username
      });
      return res.sendStatus(200);
    }
    
    if (client.seller !== username) {
      return res.status(403).json({ error: "Cliente já atribuído a outro vendedor." });
    }
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao atender cliente:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = {
  sendMessageToClient,
  getChat,
  getPanel,
  processPayment,
  endChat,
  attendClient
};
