const router = require('express').Router();
const { sendMessaging, sendMessagingButtons, api, parserBody } = require('./services');

router.get('/whatsapp/cloud-api/webhook', (req, res) => {
  try {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
        
    if (
      mode &&
      token &&
      mode === 'subscribe' &&
      process.env.Meta_WA_VerifyToken === token
    ) {
      res.setHeader('content-type', 'text/plain');
      return res.send(challenge)
    } else {
      return res.sendStatus(403);
    }
  } catch (error) {
    console.error({error})
    return res.sendStatus(500);
  }
});

router.post('/whatsapp/cloud-api/webhook', async (req, res) => {
  try {
    let data = parserBody({requestBody: req.body, currentWABA_ID: process.env.Meta_WA_wabaId})

    if (data.isMessage) {
      let incomingMessage = data.message;
      let recipientPhone = incomingMessage.from.phone;
      let recipientName = incomingMessage.from.name;
      let typeOfMsg = incomingMessage.type;
      let message_id = incomingMessage.message_id;

      await sendMessaging({
        recipientPhone,
        messsage: `Olá ${recipientName}, tudo bom com você?`
      });
      
      if (typeOfMsg === 'text_message') {
        await sendMessagingButtons({
          recipientPhone,
          messsage: "Escolha aqui em baixo o que deseja",
          buttons: [
            {
              type: "reply",
              reply: {
                id: "not-id",
                title: "Contato com vendedor" 
              }
            },
            {
              type: "reply",
              reply: {
                id: "yes-id",
                title: "Continuar aqui mesmo" 
              }
            }
          ]
        })
      }

      if (typeOfMsg === 'simple_button_message') {
        let button_id = incomingMessage.button_reply.id;

        if (button_id === 'sim-id') {
          await sendMessaging({
            recipientPhone,
            messsage: "hello 2"
          });
        }
      }

      await api.post('messages', {
        messaging_product: "whatsapp",
        message_id,
        status: "read",
      });
    }

    return res.status(200)
  } catch (error) {
    console.log(error)
    return res.sendStatus(500);
  }
});

router.use('*', (req, res) => res.status(404).send('404 Not Found'));

module.exports = router;