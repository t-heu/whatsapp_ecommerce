function isLogged(req, res, next) {
  if (req.session.user) {
    return res.redirect("/panel"); // ou qualquer outra página que faça sentido
  }
  return next();
}

module.exports = isLogged;
