const { get, ref, database } = require("../api/firebase");

const home = (req, res) => res.render("home");

const getDash = async (req, res) => {
  try {
    const { username } = req.session.user;
    
    const snapshot = await get(ref(database, `autobot/users/${username}/company`));
    
    if (!snapshot.exists()) {
      return res.render("dash", { data: [] });
    }
    
    const data = snapshot.val();
    return res.render("dash", { data });
  } catch (error) {
    console.error("Erro ao obter painel:", error);
    return res.status(500).render("dash", { data: []});
  }
};

module.exports = {
  getDash,
  home
};
