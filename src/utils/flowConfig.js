const flowConfig  = {
  "empresa_x": {
    "invalid": ["Poxa! Você precisa seguir o fluxo correto. 😕\n\n💡 *Dica*: Escolha uma opção válida ou digite *encerrar* para finalizar a conversa."],
    "endchat": ["Conversa encerrada. 😊 Se precisar de algo mais no futuro, é só nos chamar! Estamos à disposição!"],
    "thanks": ["Obrigado por entrar em contato! Sua conversa foi encerrada, mas caso precise de mais informações, basta nos enviar uma mensagem!"],
    "absent": ["Olá ", ", notamos que você ficou inativo. Como não recebemos mais respostas, estamos encerrando a conversa. Se precisar de algo, pode nos chamar novamente a qualquer momento!"],
    "att": ["Olá, nosso horário de atendimento é de 7:30 às 17:30. Por favor, envie sua mensagem durante esse horário, e teremos o prazer de ajudá-lo!"],
    "Inicio": {
      "type": "botao",
      "inAttendance": false,
      "endchat": false,
      "text": ["Olá,", "Como podemos te ajudar hoje?"],
      "buttons": [
        {
          "opcoes": ["Consultar orçamento", "FAQ"]
        },
      ]
    },
    "Consultar orçamento": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["Para agilizar seu atendimento, por favor, informe:\n\n- *Modelo, ano e motorização do veículo (exemplo: Polo 2024 1.4)*\n- *Qual peça você está procurando?*\n\nEm breve, um de nossos vendedores irá atendê-lo."]
    },
    "FAQ": {
      "type": "botao",
      "inAttendance": false,
      "endchat": false,
      "text": ["FAQ - Escolha uma opção:"],
      "buttons": [
        {
          "opcoes": ["Funcionamento", "Formas de pagamento"]
        },
      ]
    },
    "Funcionamento": {
      "type": "text",
      "inAttendance": false,
      "endchat": true,
      "text": ["Nosso horário de funcionamento é das *7:30 às 17:30*."]
    },
    "Formas de pagamento": {
      "type": "text",
      "inAttendance": false,
      "endchat": true,
      "text": ["Aceitamos as seguintes formas de pagamento:\n\n- *Pix*\n- *Cartão*\n- *Espécie*"]
    },
    "Escolha a forma de pagamento via PIX:": {
      "type": "botao",
      "inAttendance": false,
      "endchat": false,
      "text": ["Escolha a forma de PIX que vai ser"],
      "buttons": [
        {
          "opcoes": ["QR Code 📸", "CNPJ 🏢", "Pix Copia e Cola 📋"]
        },
      ]
    },
    "QR Code 📸": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["Para pagamento via **Pix**, você pode usar o **QR Code** abaixo: \n [QR CODE]", "\nApós o pagamento, por favor, envie o comprovante para confirmar a transação. Caso precise de ajuda, estamos à disposição!"],
    },
    "CNPJ 🏢": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["Para pagamento via ** Pix ** , utilize o ** CNPJ ** abaixo: \n [00.000.000/0000-00]","\n*Não se esqueça de enviar o comprovante* logo após o pagamento. Estamos à disposição para qualquer dúvida!"],
    },
    "Pix Copia e Cola 📋": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["Para pagamento via **Pix** Copia e Cola, use o link abaixo: \n [linkPix]","\nApós o pagamento, envie o comprovante para confirmar a transação. Se precisar de ajuda, estamos aqui para auxiliar!"],
    },
  }
}

function getChatFlow(enterprise) {
  return flowConfig[enterprise];
}

module.exports = { getChatFlow };
