const express = require("express");

const v1Router = express.Router();
const rateLimit = require("./middlewares/rateLimit");
const isAuthenticated = require("./middlewares/isAuthenticated");
const isLogged = require("./middlewares/isLogged");

const authController = require("./controllers/authController");
const chatController = require("./controllers/chatController");
const webhookController = require("./controllers/webhookController");

v1Router.get("/", isLogged, chatController.home);
v1Router.get("/signup", isLogged, authController.signup);
v1Router.post("/signup", isLogged, rateLimit, authController.createUser);
v1Router.get("/login", isLogged, authController.login);
v1Router.post("/login", isLogged, rateLimit, authController.authenticateUser);
v1Router.post("/logout", isAuthenticated, authController.logout);
v1Router.post("/forgot-password", isLogged, authController.forgotPassword);
v1Router.post("/send", isAuthenticated, chatController.sendMessageToClient);
v1Router.get("/chat/:number", isAuthenticated, chatController.getChat);
v1Router.get("/panel", isAuthenticated, chatController.getPanel);
v1Router.post("/pay", isAuthenticated, chatController.processPayment);
v1Router.post("/end", isAuthenticated, chatController.endChat);
v1Router.post("/attend", isAuthenticated, chatController.attendClient);

// Webhook para receber mensagens do WhatsApp
v1Router.post("/webhook", webhookController.receiveMessage);
// Webhook de verificação do WhatsApp
v1Router.get("/webhook", webhookController.verifyWebhook);
v1Router.use((req, res) => res.status(404).render("404", { title: "Página Não Encontrada" }));

module.exports = { v1Router };
