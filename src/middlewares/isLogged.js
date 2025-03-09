function isLogged(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dash"); // ou qualquer outra página que faça sentido
  }

  if (req.session.seller) {
    return res.redirect("/seller/panel"); // ou qualquer outra página que faça sentido
  }

  return next();
}

module.exports = isLogged;
