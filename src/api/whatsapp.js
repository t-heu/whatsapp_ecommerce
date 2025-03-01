const axios = require("axios");

const TOKEN = process.env.Meta_WA_accessToken;
const PHONE_NUMBER_ID = process.env.Meta_WA_SenderPhoneNumberId; // Substitua pelo número de destino

const API_URL = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

// Função para enviar mensagens interativas (botões)
const sendInteractiveMessage = async (to, body, buttons) => {
  try {
    const data = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((btn, index) => ({
            type: "reply",
            reply: { id: `btn_${index}`, title: btn },
          })),
        },
      },
    };

    await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.response?.data || error.message);
  }
};

// Função para enviar mensagens normais (texto)
const sendMessage = async (to, text) => {
  try {
    const data = {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    };

    await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.response?.data || error.message);
  }
};

module.exports = {
  sendMessage,
  sendInteractiveMessage
};
