const bcrypt = require("bcrypt");

const { get, ref, database, set } = require("../api/firebase");

exports.signup = async (req, res) => res.render("signup")

exports.createUser = async (req, res) => {
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
}

exports.login = async (req, res) => res.render("login");

exports.authenticateUser = async (req, res) => {
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
}

// Função para gerar senha aleatória
function generateRandomPassword(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Esqueceu a senha (gera nova senha e salva no Firebase)
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: "Usuário é obrigatório." });
    }

    const userRef = ref(database, `zero/users/${username}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (!userData) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    // Gerar nova senha e criptografá-la
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco de dados
    await set(userRef, { ...userData, password: hashedPassword });

    return res.json({ success: true, message: `Nova senha gerada: ${newPassword}` });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};

exports.logout = async (req, res) => req.session.destroy(() => res.redirect("/"));
