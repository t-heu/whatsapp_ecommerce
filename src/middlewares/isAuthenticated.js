function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.redirect("/"); // Redireciona para login se não estiver autenticado
}

module.exports = isAuthenticated;
