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

  const name = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0].profile?.name;
  const from = message.from; // Número do cliente
  const text = message.text?.body?.toLowerCase(); // Mensagem recebida
  const button_id = message.interactive?.button_reply.id; // ID do botão pressionado
  const button_title = message.interactive?.button_reply.title;
  const button_key = `${button_id}_${button_title}`;

  let escolhaAnterior = clientesInteragiram.get(from) || null;
  const fluxoPermitido = {
    "Inicio": ["Consultar orçamento", "FAQ"],
    "Consultar orçamento": [],
    "FAQ": ["Horário de funci.", "Formas de pagamento"],
    "Horário de funci.": [],
    "Formas de pagamento": []
  };

  reiniciarTimeout(from);

  if (isOwner(from)) {
    if (text?.includes("/end")) {
      await sendMessage(from, messages.obrigado);
      clientesInteragiram.delete(from);
      clientesEmAtendimento.delete(from);
      return res.sendStatus(200);
    }
    
    if (text?.includes("/pay")) {
      await sendInteractiveMessage(from, "Escolha a forma de pagamento via PIX:", [
        "QR Code 📸",
        "CNPJ 🏢",
        "Pix Copia e Cola 📋",
      ]);
      return res.sendStatus(200);
    }
  }

  // 🚫 Se o cliente está em atendimento humano, não interagir
  if (clientesEmAtendimento.has(from)) {
    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientesInteragiram.has(from)) {
    await sendInteractiveMessage(from, `${messages.inicio_1} ${name}! ${messages.inicio_2}`, fluxoPermitido["Inicio"]);

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

  const actions = {
    "btn_0_Consultar orçamento": async () => {
      await sendMessage(from, messages.consultar_orcamento);
      clientesEmAtendimento.set(from, true);
    },
    "btn_1_FAQ": async () => {
      await sendInteractiveMessage(from, messages.faq_opcoes, fluxoPermitido["FAQ"]);
    },
    "btn_0_Horário de funci.": async () => {
      await sendMessage(from, messages.horario_funcionamento);
      clientesInteragiram.delete(from);
    },
    "btn_1_Formas de pagamento": async () => {
      await sendMessage(from, messages.formas_pagamento);
      clientesInteragiram.delete(from);
    },
    "btn_0_QR Code 📸": async () => {
      await sendMessage(from, messages.pagamento_qr);
      await sendMessage(from, messages.confirmacao_pagamento);
    },
    "btn_1_CNPJ 🏢": async () => {
      await sendMessage(from, messages.pagamento_cnpj);
      await sendMessage(from, messages.confirmacao_pagamento);
    },
    "btn_2_Pix Copia e Cola 📋": async () => {
      await sendMessage(from, messages.pagamento_pix);
      await sendMessage(from, messages.confirmacao_pagamento);
    }
  };

  if (actions[button_key]) {
    await actions[button_key]();
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
