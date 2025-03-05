const bcrypt = require("bcrypt");

const { get, ref, push, update, remove, database, set } = require("../api/firebase");
const { sendMessage, sendInteractiveMessage } = require("../api/whatsapp");
const { getChatFlow } = require("../utils/flowConfig");
const { clearUserTimeout } = require("../utils/timeoutManager");

const flow = getChatFlow("empresa_x");

const sendMessageToClient = async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ error: "Número e mensagem são obrigatórios." });
    }

    const snapshot = await get(ref(database, `zero/chats/${number}`));
    const clientState = snapshot.val();

    if (!clientState || !clientState.client) {
      return res.status(404).json({ error: "Cliente não encontrado ou saiu." });
    }

    await sendMessage(number, message);

    const newMessage = { sender: "Você", text: message };
    await push(ref(database, `zero/chats/${number}/client/messages`), newMessage);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const getChat = async (req, res) => {
  try {
    const { number } = req.params;
    const snapshot = await get(ref(database, `zero/chats/${number}`));

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

const home = (req, res) => res.render("home");
const login = (req, res) => res.render("login");
const signup = (req, res) => res.render("signup");
const logout = (req, res) => req.session.destroy(() => res.redirect("/"));

const authenticateUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });
    }
    
    const snapshot = await get(ref(database, `zero/users/${username}`));
    const data = snapshot.val();
    
    if (!data || !(await bcrypt.compare(password, data.password))) {
      return res.status(401).json({ success: false, message: "Usuário ou senha incorretos." });
    }
    
    req.session.user = { username };
    return res.json({ success: true });
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "As senhas não coincidem." });
    }
    
    const userRef = ref(database, `zero/users/${username}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return res.status(400).json({ success: false, message: "Usuário já existe." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await set(userRef, { password: hashedPassword, name: username });
    
    return res.json({ success: true, message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};

const getPanel = async (req, res) => {
  try {
    const { username } = req.session.user;
    const snapshot = await get(ref(database, "zero/chats"));
    
    if (!snapshot.exists()) {
      return res.render("panel", { queue: [] });
    }
    
    const clientsInService = Object.values(snapshot.val()).filter(client => client.inService);
    return res.render("panel", { queue: clientsInService, username, number: '' });
  } catch (error) {
    console.error("Erro ao obter painel:", error);
    return res.status(500).render("panel", { queue: [], username: "" });
  }
};

const processPayment = async (req, res) => {
  try {
    const { number } = req.body;
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    const nextStep = flow["Escolha a forma de pagamento via PIX:"];
    await sendInteractiveMessage(number, nextStep.text[0], nextStep.buttons[0].opcoes);
    
    await update(ref(database), {
      [`zero/chats/${number}/inService`]: false,
      [`zero/chats/${number}/step`]: "Escolha a forma de pagamento via PIX:"
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
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    await sendMessage(number, flow.thanks[0]);
    await remove(ref(database, `zero/chats/${number}`));
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
    
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido." });
    }
    
    const snapshot = await get(ref(database, `zero/chats/${number}`));
    
    if (!snapshot.exists() || !snapshot.val()?.client) {
      return res.status(404).json({ error: "Chat ou cliente não encontrado." });
    }
    
    const { client } = snapshot.val();
    
    if (!client.seller) {
      await update(ref(database), {
        [`zero/chats/${number}/client/seller`]: req.session.user.username
      });
      return res.sendStatus(200);
    }
    
    if (client.seller !== req.session.user.username) {
      return res.status(403).json({ error: "Cliente já atribuído a outro vendedor." });
    }
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao atender cliente:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = {
  home,
  sendMessageToClient,
  getChat,
  login,
  signup,
  authenticateUser,
  getPanel,
  processPayment,
  endChat,
  attendClient,
  logout,
  createUser
};
