const express = require("express");

const v1Router = express.Router();
const { sendMessage, sendInteractiveMessage } = require("./service");
const { resetTimeout, startTimeout } = require("./utils/autoCloseSession");
const { clientsData, isOwner } = require("./utils/config");
const messages = require("./messages.json");
const { suggestComplement } = require("./utils/upsellAI");

const suggests = ["pastilha de freio", "pastilhas", "past. freio", "disco de freio", "disco", "fluido de freio",
  "amortecedor", "amort.", "mola", "molas", "coifa", "batente","bucha", "pivô", "bieleta", "correia dentada", "tensor", "vela de ignição", "bobina de ignição", "bomba de óleo", "cárter",
  "embreagem", "kit de embreagem", "cabo de embreagem", "eixo homocinético", "semi-eixo",
  "radiador", "ventoinha", "bomba d'água", "mangueira do radiador", "válvula termostática",
  "bateria", "alternador", "motor de partida", "velas", "bobina", "fusível", "relé",
  "caixa de direção", "barra de direção", "ponta de eixo", "bomba hidráulica", "fluido de direção",
  "pneu", "pneus", "calota", "aro", "câmara de ar", "estepe", "válvula de ar","para-lama", "paralama", "para-barro", "capô", "parachoque", "porta-malas", "retrovisor",
  "catalisador", "silencioso", "tubo de escape", "coletor de escape", "flexível de escapamento"
];

const purchaseKeywords = ["preço", "valor", "quanto", "compra", "orçamento"];

const flowSteps = {
  "Inicio": ["Consultar orçamento", "FAQ"],
  "Consultar orçamento": [],
  "FAQ": ["Horário de funci.", "Formas de pagamento"],
  "Horário de funci.": [],
  "Formas de pagamento": []
};

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

  let clientState = clientsData.get(from) || { step: null, inService: false };

  resetTimeout(from);

  if (isOwner(from)) {
    if (text?.includes("/end")) {
      await sendMessage(from, messages.obrigado);
      clientsData.delete(from);
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

  if (text && suggests.some(item => text.includes(item))) {
    const foundKeyword = purchaseKeywords.find(keyword => text.includes(keyword));

    if (foundKeyword) {
      const complement = await suggestComplement(text);
      await sendMessage(from, `Antes de te passar ${foundKeyword}, que tal levar também ${complement}?`);
      return res.sendStatus(200);
    }
  }

  // 🚫 Se o cliente está em atendimento humano, não interagir
  if (clientState.inService) {
    return res.sendStatus(200);
  }

  // Se o cliente ainda não interagiu, envia as opções iniciais
  if (!clientState.step) {
    await sendInteractiveMessage(from, `${messages.inicio_1} ${name}! ${messages.inicio_2}`, flowSteps["Inicio"]);

    clientsData.set(from, { step: "Inicio", inService: false });
    startTimeout(from);
    return res.sendStatus(200);
  }

  // Se quiser encerrar a conversa
  if (text?.includes("encerrar")) {
    await sendMessage(from, messages.encerrar);
    clientsData.delete(from);
    return res.sendStatus(200);
  }

  // 🚫 Impede escolhas fora do fluxo esperado
  if (!flowSteps[clientState.step]?.includes(button_title)) {
    await sendMessage(from, messages.fluxo_invalido);
    return res.sendStatus(200);
  }

  // ✅ Agora podemos registrar a nova escolha
  clientsData.set(from, { step: button_title, inService: clientState.inService });

  const actions = {
    "btn_0_Consultar orçamento": async () => {
      await sendMessage(from, messages.consultar_orcamento);
      clientsData.set(from, { step: clientState.step, inService: true });
    },
    "btn_1_FAQ": async () => {
      await sendInteractiveMessage(from, messages.faq_opcoes, flowSteps["FAQ"]);
    },
    "btn_0_Horário de funci.": async () => {
      await sendMessage(from, messages.horario_funcionamento);
      clientsData.delete(from);
    },
    "btn_1_Formas de pagamento": async () => {
      await sendMessage(from, messages.formas_pagamento);
      clientsData.delete(from);
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
