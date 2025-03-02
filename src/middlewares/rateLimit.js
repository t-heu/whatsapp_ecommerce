const rateLimit = require('express-rate-limit');

// Limitar tentativas de login
const rate_limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limitar a 5 tentativas de login por IP
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  skipFailedRequests: true, // Ignorar tentativas falhas (apenas conta tentativas de sucesso)
});

module.exports = rate_limiter;
