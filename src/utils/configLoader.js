const aaa = {
  "empresa_x": {
    "invalid": ["Poxa! Você precisa seguir o fluxo correto. 😕\n\n💡 *Dica*: Escolha uma opção válida ou digite *encerrar* para finalizar a conversa."],
    "endchat": ["Conversa encerrada. Se precisar de algo, estamos à disposição! 😊"],
    "thanks": ["Obrigado por comprar conosco! Qualquer dúvida, estamos à disposição. 😊"],
    "absent": ["Parece que você se ausentou! Encerramos a conversa para otimizar seu atendimento. Caso precise de algo, é só mandar uma mensagem! 😊"],
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
          "opcoes": ["Horário de funci.", "Formas de pagamento"]
        },
      ]
    },
    "Horário de funci.": {
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
      "text": ["Escolha a forma de pagamento via PIX:"],
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
      "text": ["Aqui está o QR Code para pagamento:","[QR CODE]","*Não esqueça de enviar o comprovante!*", "Após o pagamento, enviaremos a confirmação.\nSe precisar de mais alguma coisa, estamos à disposição."],
    },
    "CNPJ 🏢": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["CNPJ para pagamento:","00.000.000/0000-00","*Não esqueça de enviar o comprovante!*", "Após o pagamento, enviaremos a confirmação.\nSe precisar de mais alguma coisa, estamos à disposição."],
    },
    "Pix Copia e Cola 📋": {
      "type": "text",
      "inAttendance": true,
      "endchat": false,
      "text": ["Pix Copia e Cola:","[linkPix]","*Não esqueça de enviar o comprovante!*", "Após o pagamento, enviaremos a confirmação.\nSe precisar de mais alguma coisa, estamos à disposição."],
    },
  }
}

function getFlowConfig(empresa) {
  return aaa[empresa];
}

module.exports = { getFlowConfig };
