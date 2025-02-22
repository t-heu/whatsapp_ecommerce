const express = require("express");

const v1Router = express.Router();
const { sendMessage, sendInteractiveMessage } = require("./service");

const clientesInteragiram = new Set();

// Webhook para receber mensagens
v1Router.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object) {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message) {
      const from = message.from; // Número do cliente
      const text = message.text?.body?.toLowerCase(); // Mensagem recebida
      const button_id = message.interactive?.button_reply.id; // ID do botão pressionado
      const button_title = message.interactive?.button_reply.title;

      // console.log(message)

      // Se o cliente ainda não interagiu, envia as opções iniciais
      if (!clientesInteragiram.has(from)) {
        await sendInteractiveMessage(from, "Olá! Como podemos te ajudar hoje?", [
          "Consultar orçamento",
          "FAQ",
        ]);
        // Marca o cliente como já interagido
        clientesInteragiram.add(from);
        return res.sendStatus(200);
      }

      // Se escolheu "Consultar orçamento"
      if (button_id === "btn_0" && button_title === "Consultar orçamento") {
        await sendMessage(from, "Para agilizar seu atendimento, informe:\n\n- *Modelo do veículo, ano e motor (ex.: Polo 2024 1.4, Mobi 1.0 2024…)*\n- *Qual peça você procura?*");
        return res.sendStatus(200);
      }

      // Se escolheu "FAQ"
      if (button_id === "btn_1" && button_title === "FAQ") {
        await sendInteractiveMessage(from, "FAQ - Escolha uma opção:", [
          "Horário de funci.",
          "Formas de pagamento",
        ]);
        return res.sendStatus(200);
      }

      // Respostas do FAQ
      if (button_id === "btn_0" && button_title === "Horário de funci.") {
        await sendMessage(from, "Nosso horário de funcionamento é das *7:30 às 17:30*.");
        return res.sendStatus(200);
      }

      if (button_id === "btn_1" && button_title === "Formas de pagamento") {
        await sendMessage(from, "Aceitamos as seguintes formas de pagamento:\n\n- *Pix*\n- *Cartão*\n- *Espécie*");
        return res.sendStatus(200);
      }

      // Finalização de pagamento (/pay)
      if (text?.includes("/pay")) {
        await sendInteractiveMessage(from, "Escolha a forma de pagamento via PIX:", [
          "QR Code 📸",
          "CNPJ 🏢",
          "Pix Copia e Cola 📋",
        ]);
      }

      // Se escolher pagamento por QR Code
      if (button_id === "btn_0") {
        await sendMessage(from, "Aqui está o QR Code para pagamento:\n\n*[QR CODE]*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
      }

      // Se escolher pagamento por CNPJ
      if (button_id === "btn_1") {
        await sendMessage(from, "CNPJ para pagamento:\n\n*00.000.000/0000-00*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
      }

      // Se escolher Pix Copia e Cola
      if (button_id === "btn_2") {
        await sendMessage(from, "Pix Copia e Cola:\n\n*linkPix*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
      }

      // Finalizar conversa (/end)
      if (text?.includes("/end")) {
        await sendMessage(from, "Obrigado por comprar conosco! Qualquer dúvida, estamos à disposição. 😊");
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
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

module.exports = {
  v1Router
};
