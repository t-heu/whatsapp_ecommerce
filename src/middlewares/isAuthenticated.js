function isAuthenticated(req, res, next) {
  if (req.session.user || req.session.seller) {
    return next();
  }
  
  res.redirect("/");
}

module.exports = isAuthenticated;
