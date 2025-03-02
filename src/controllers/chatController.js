const bcrypt = require("bcrypt");

const { get, ref, push, update, remove, database, set } = require("../api/firebase");
const { sendMessage, sendInteractiveMessage } = require("../api/whatsapp");
const { getFlowConfig } = require("../utils/configLoader");
const { stopTimeout } = require("../utils/autoCloseSession");

const empresa = "empresa_x";
const flow = getFlowConfig(empresa);

const home = (req, res) => res.render("home");

const sendMessageToClient = async (req, res) => {
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
};

const getChat = async (req, res) => {
  const number = req.params.number;
  const snapshot = await get(ref(database, `zero/chats/${number}`));

  if (!snapshot.exists()) return res.status(404).json({ error: "Chat não encontrado" });

  const { client } = snapshot.val();
  if (!client) return res.status(400).json({ error: "Cliente não encontrado" });

  return res.status(200).json({ 
    messages: client.messages || [],
    number,
    name: client.name
  });
};

const login = (req, res) => res.render("login");
const signup = (req, res) => res.render("signup");
const logout = (req, res) => {
  return req.session.destroy(() => {
    return res.redirect("/");
  });
};

const authenticateUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const snapshot = await get(ref(database, `zero/users/${username}`));
    const data = snapshot.val();

    if (!data) {
      return res.json({ success: false, message: "Usuário ou senha incorretos!" });
    }

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Usuário ou senha incorretos!" });
    }

    req.session.user = { username };
    res.json({ success: true });

  } catch (error) {
    console.error("Erro ao autenticar:", error);
    res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios!" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "As senhas não coincidem!" });
    }

    const userRef = ref(database, `zero/users/${username}`);

    // Verifica se o usuário já existe
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return res.status(400).json({ success: false, message: "Usuário já existe!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await set(userRef, { password: hashedPassword, name: username });

    return res.json({ success: true, message: "Usuário cadastrado com sucesso!" });

  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao cadastrar usuário." });
  }
};

const getPanel = async (req, res) => {
  const username = req.session.user.username
  const snapshot = await get(ref(database, "zero/chats"));
  
  if (!snapshot.exists()) {
    return res.render("panel", { queue: [], messages: [] });
  }

  const clientsInService = Object.values(snapshot.val()).filter(client => client.inService);
  res.render("panel", { queue: clientsInService, username, number: '' });
};

const processPayment = async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: "Número não fornecido" });

  const nextStep = flow["Escolha a forma de pagamento via PIX:"];
  await sendInteractiveMessage(number, nextStep.text[0], nextStep.buttons[0].opcoes);

  update(ref(database), {
    [`zero/chats/${number}/inService`]: false,
    [`zero/chats/${number}/step`]: "Escolha a forma de pagamento via PIX:"
  });

  return res.sendStatus(200);
};

const endChat = async (req, res) => {
  const { number } = req.body;

  await sendMessage(number, flow.thanks[0]);
  remove(ref(database, `zero/chats/${number}`));
  stopTimeout(number)

  return res.sendStatus(200);
};

const attendClient = async (req, res) => {
  const { number } = req.body;

  const snapshot = await get(ref(database, `zero/chats/${number}`));
  if (!snapshot.exists()) return res.status(404).json({ error: "Chat não encontrado" });

  const { client } = snapshot.val();
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" });

  if (!client.seller) {
    update(ref(database), {
      [`zero/chats/${number}/client/seller`]: req.session.user.username
    });
    return res.sendStatus(200);
  }

  if (client.seller !== req.session.user.username) {
    return res.status(403).json({ error: "Cliente já atribuído a outro vendedor" });
  }

  return res.sendStatus(200);
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
