const express = require("express");

const v1Router = express.Router();
const { sendMessage, sendInteractiveMessage } = require("./service");
const { reiniciarTimeout, iniciarTimeout } = require("./utils/autoCloseSession");
const { clientesInteragiram, isOwner } = require("./utils/config");

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

      let escolhaAnterior = clientesInteragiram.get(from) || null;
      
      const fluxoPermitido = {
        "Inicio": ["Consultar orçamento", "FAQ"],
        "Consultar orçamento": [], // Não há fluxo adicional aqui
        "FAQ": ["Horário de funci.", "Formas de pagamento"],
        "Horário de funci.": [], // Fluxo termina aqui
        "Formas de pagamento": [] // Fluxo termina aqui
      };

      // Se quiser encerrar a conversa
      if (text?.includes("encerrar")) {
        await sendMessage(from, "Conversa encerrada. Se precisar de algo, estamos à disposição! 😊");
        clientesInteragiram.delete(from);
        return res.sendStatus(200);
      }

      // Finalizar conversa (/end)
      if (text?.includes("/end") && isOwner(from)) {
        await sendMessage(from, "Obrigado por comprar conosco! Qualquer dúvida, estamos à disposição. 😊");
      }
      
      // Finalização de pagamento (/pay)
      if (text?.includes("/pay") && isOwner(from)) {
        await sendInteractiveMessage(from, "Escolha a forma de pagamento via PIX:", [
          "QR Code 📸",
          "CNPJ 🏢",
          "Pix Copia e Cola 📋",
        ]);
      }

      // Se o cliente ainda não interagiu, envia as opções iniciais
      if (!clientesInteragiram.has(from)) {
        await sendInteractiveMessage(from, "Olá! Como podemos te ajudar hoje?", [
          "Consultar orçamento",
          "FAQ",
        ]);
        // Marca o cliente como já interagido
        clientesInteragiram.set(from, "Inicio");
        iniciarTimeout(from);
        return res.sendStatus(200);
      }

      // 🚫 Impede escolhas fora do fluxo esperado
      if (escolhaAnterior !== "Inicio" && !fluxoPermitido[escolhaAnterior]?.includes(button_title)) {
        await sendMessage(from, "Poxa! Você precisa seguir o fluxo correto. 😕\n\n💡 *Dica*: Escolha uma opção válida ou digite *encerrar* para finalizar a conversa.");
        return res.sendStatus(200);
      }

      // ✅ Agora podemos registrar a nova escolha
      clientesInteragiram.set(from, button_title);
      reiniciarTimeout(from); // Reseta o tempo de encerramento automático

      // Se escolheu "Consultar orçamento"
      if (button_id === "btn_0" && button_title === "Consultar orçamento") {
        await sendMessage(from, "Para agilizar seu atendimento, informe:\n\n- *Modelo do veículo, ano e motor (ex.: Polo 2024 1.4, Mobi 1.0 2024…)*\n- *Qual peça você procura?*");
        clientesInteragiram.set(from, "Inicio");
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
        clientesInteragiram.delete(from);
        return res.sendStatus(200);
      }

      if (button_id === "btn_1" && button_title === "Formas de pagamento") {
        await sendMessage(from, "Aceitamos as seguintes formas de pagamento:\n\n- *Pix*\n- *Cartão*\n- *Espécie*");
        clientesInteragiram.delete(from);
        return res.sendStatus(200);
      }

      // Se escolher pagamento por QR Code
      if (button_id === "btn_0" && button_title === "QR Code 📸") {
        await sendMessage(from, "Aqui está o QR Code para pagamento:\n\n*[QR CODE]*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
      }

      // Se escolher pagamento por CNPJ
      if (button_id === "btn_1" && button_title === "CNPJ 🏢") {
        await sendMessage(from, "CNPJ para pagamento:\n\n*00.000.000/0000-00*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
      }

      // Se escolher Pix Copia e Cola
      if (button_id === "btn_2" && button_title === "Pix Copia e Cola 📋") {
        await sendMessage(from, "Pix Copia e Cola:\n\n*linkPix*\n\n*Não esqueça de enviar o comprovante!*");
        await sendMessage(from, "Após o pagamento, enviaremos a confirmação.");
        await sendMessage(from, "Se precisar de mais alguma coisa, estamos à disposição.");
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
