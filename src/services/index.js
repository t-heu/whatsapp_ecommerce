const { api } = require('./api');

async function sendMessaging({recipientPhone, messsage}) {
  // message simple
  await api.post('messages', {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientPhone,
    type: "text",
    text: {
      preview_url: false,
      body: messsage
    }
  });
}

async function sendMessagingButtons({recipientPhone, messsage, buttons}) {
  /**
   * buttons: [
          {
            type: "reply",
            reply: {
              id: "sim-id",
              title: "Sim" 
            }
          },
          {
            type: "reply",
            reply: {
              id: "nao-id",
              title: "Não" 
            }
          }
      ]
   */
  const res_buttons_one = await api.post('messages', {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientPhone,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: messsage,
      },
      action: {
        buttons
      },
    }
  });
}

module.exports = {sendMessaging, sendMessagingButtons, api}
