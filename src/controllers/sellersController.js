const bcrypt = require("bcrypt");

const { get, ref, database, set } = require("../api/firebase");

exports.home = (req, res) => res.render("sellers/home");

exports.createUser = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "As senhas não coincidem." });
    }
    
    const userRef = ref(database, `autobot/users/${username}`);
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

exports.authenticateUser = async (req, res) => {
  try {
    const { company, username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });
    }
    
    const snapshot = await get(ref(database, `autobot/users/${company}/company/sellers/${username}`));
    const data = snapshot.val();
    
    if (!data || !(await bcrypt.compare(password, data.password))) {
      return res.status(401).json({ success: false, message: "Usuário ou senha incorretos." });
    }
    
    req.session.seller = { username, company };
    return res.json({ success: true });
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
}

exports.logout = async (req, res) => req.session.destroy(() => res.redirect("/"));
