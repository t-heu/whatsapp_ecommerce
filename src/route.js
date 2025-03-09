const express = require("express");

const v1Router = express.Router();
const rateLimit = require("./middlewares/rateLimit");
const isAuthenticated = require("./middlewares/isAuthenticated");
const isLogged = require("./middlewares/isLogged");

const authController = require("./controllers/authController");
const chatController = require("./controllers/chatController");
const webhookController = require("./controllers/webhookController");
const dashController = require("./controllers/dashController");
const sellersController = require("./controllers/sellersController");

// Company
v1Router.get("/", isLogged, dashController.home);
v1Router.post("/signup", isLogged, rateLimit, authController.createUser);
v1Router.post("/login", isLogged, rateLimit, authController.authenticateUser);
v1Router.post("/forgot-password", isLogged, authController.forgotPassword);
v1Router.get("/dash",isAuthenticated, dashController.getDash);
v1Router.post("/logout", isAuthenticated, authController.logout);

// Seller
v1Router.get("/seller", isLogged, sellersController.home);
v1Router.post("/seller/login", isLogged, rateLimit, sellersController.authenticateUser);
v1Router.post("/seller/signup", isLogged, rateLimit, sellersController.createUser);
v1Router.post("/seller/send", isAuthenticated, chatController.sendMessageToClient);
v1Router.get("/seller/chat/:number", isAuthenticated, chatController.getChat);
v1Router.get("/seller/panel", isAuthenticated, chatController.getPanel);
v1Router.post("/seller/pay", isAuthenticated, chatController.processPayment);
v1Router.post("/seller/end", isAuthenticated, chatController.endChat);
v1Router.post("/seller/attend", isAuthenticated, chatController.attendClient);
v1Router.post("/seller/logout", isAuthenticated, sellersController.logout);

// Webhook para receber mensagens do WhatsApp
v1Router.post("/webhook", webhookController.receiveMessage);
// Webhook de verificação do WhatsApp
v1Router.get("/webhook", webhookController.verifyWebhook);
v1Router.use((req, res) => res.status(404).render("404", { title: "Página Não Encontrada" }));

module.exports = { v1Router };
