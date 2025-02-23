const express = require("express");

const v1Router = express.Router();
const { sendMessage, sendInteractiveMessage } = require("./service");
const { reiniciarTimeout, iniciarTimeout } = require("./utils/autoCloseSession");
const { clientesInteragiram, isOwner, clientesEmAtendimento } = require("./utils/config");
const messages = require("./messages.json");

// Webhook para receber mensagens
v1Router.post("/webhook", async (req, res) => {
  const body = req.body;
  if (!body.object) return res.sendStatus(404);

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);

  const from = message.from; // Número do cliente
  const text = message.text?.body?.toLowerCase(); // Mensagem recebida
  const button_id = message.interactive?.button_reply.id; // ID do botão pressionado
  const button_title = message.interactive?.button_reply.title;

  let escolhaAnterior = clientesInteragiram.get(from) || null;
      
  const fluxoPermitido = {
    "Inicio": ["Consultar orçamento", "FAQ"],
    "Consultar orçamento": [],
    "FAQ": ["Horário de funci.", "Formas de pagamento"],
    "Horário de funci.": [],
    "Formas de pagamento": []
  };

  reiniciarTimeout(from);

  // Finalizar conversa (/end)
  if (text?.includes("/end") && isOwner(from)) {
    await sendMessage(from, messages.obrigado);
    clientesInteragiram.delete(from);
    clientesEmAtendimento.delete(from);
    return res.sendStatus(200);
  }
        
  // Finalização de pagamento (/pay)
  if (text?.includes("/pay") && isOwner(from)) {
    await sendInteractiveMessage(from, "Escolha a forma de pagamento via PIX:", [
      "QR Code 📸",
      "CNPJ 🏢",
      "Pix Copia e Cola 📋",
    ]);
    return res.sendStatus(200);
  }

  // 🚫 Se o cliente está em atendimento humano, não interagir
  if (clientesEmAtendimento.has(from)) {
    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientesInteragiram.has(from)) {
    await sendInteractiveMessage(from, messages.inicio, fluxoPermitido["Inicio"]);

    clientesInteragiram.set(from, "Inicio");
    iniciarTimeout(from);
    return res.sendStatus(200);
  }

  // Se quiser encerrar a conversa
  if (text?.includes("encerrar")) {
    await sendMessage(from, messages.encerrar);
    clientesInteragiram.delete(from);
    return res.sendStatus(200);
  }

  // 🚫 Impede escolhas fora do fluxo esperado
  if (!escolhaAnterior || !fluxoPermitido[escolhaAnterior]?.includes(button_title)) {
    await sendMessage(from, messages.fluxo_invalido);
    return res.sendStatus(200);
  }

  // ✅ Agora podemos registrar a nova escolha
  clientesInteragiram.set(from, button_title);

  // Se escolheu "Consultar orçamento"
  if (button_id === "btn_0" && button_title === "Consultar orçamento") {
    await sendMessage(from, messages.consultar_orcamento);
    clientesEmAtendimento.set(from, true);
    return res.sendStatus(200);
  }

  // Se escolheu "FAQ"
  if (button_id === "btn_1" && button_title === "FAQ") {
    await sendInteractiveMessage(from, messages.faq_opcoes, fluxoPermitido["FAQ"]);
    return res.sendStatus(200);
  }

  // Respostas do FAQ
  if (button_id === "btn_0" && button_title === "Horário de funci.") {
    await sendMessage(from, messages.horario_funcionamento);
    clientesInteragiram.delete(from);
    return res.sendStatus(200);
  }

  if (button_id === "btn_1" && button_title === "Formas de pagamento") {
    await sendMessage(from, messages.formas_pagamento);
    clientesInteragiram.delete(from);
    return res.sendStatus(200);
  }

  // Se escolher pagamento por QR Code
  if (button_id === "btn_0" && button_title === "QR Code 📸") {
    await sendMessage(from, messages.pagamento_qr);
    await sendMessage(from, messages.confirmacao_pagamento);
    return res.sendStatus(200);
  }

  // Se escolher pagamento por CNPJ
  if (button_id === "btn_1" && button_title === "CNPJ 🏢") {
    await sendMessage(from, messages.pagamento_cnpj);
    await sendMessage(from, messages.confirmacao_pagamento);
    return res.sendStatus(200);
  }

  // Se escolher Pix Copia e Cola
  if (button_id === "btn_2" && button_title === "Pix Copia e Cola 📋") {
    await sendMessage(from, messages.pagamento_pix);
    await sendMessage(from, messages.confirmacao_pagamento);
    return res.sendStatus(200);
  }
    
  res.sendStatus(200);
});

// Webhook de verificação do WhatsApp
v1Router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN_SECRET;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = { v1Router };
