const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');

const { sendMessaging, sendMessagingButtons, api } = require('./services');

const Whatsapp = new WhatsappCloudAPI({
  accessToken: process.env.Meta_WA_accessToken,
  senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
  WABA_ID: process.env.Meta_WA_wabaId,
});

router.get('/webhook', (req, res) => {
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

router.post('/webhook', async (req, res) => {
  try {
    let data = Whatsapp.parseMessage(req.body);
    
    if (data.isMessage) {
      let incomingMessage = data.message;
      let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
      let recipientName = incomingMessage.from.name;
      let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
      let message_id = incomingMessage.message_id; // extract the message id
      
      await sendMessaging({
        recipientPhone,
        messsage: "hello"
      });
      
      if (typeOfMsg === 'text_message') {
        await sendMessagingButtons({
          recipientPhone,
          messsage: "oi",
          buttons: [
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
        })
      }

      if (typeOfMsg === 'simple_button_message') {
        let button_id = incomingMessage.button_reply.id;

        if (button_id === 'sim-id') {
          await sendMessaging({
            recipientPhone,
            messsage: "hello"
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