const router = require('express').Router();
// const axios = require('axios')
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');

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
    
    if (data?.isMessage) {
      let incomingMessage = data.message;
      let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
      let recipientName = incomingMessage.from.name;
      let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
      let message_id = incomingMessage.message_id; // extract the message id
      /*const resa = await axios.post(`https://graph.facebook.com/v13.0/${process.env.Meta_WA_SenderPhoneNumberId}/messages`, {
        data: {
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": recipientPhone,
          "type": "text",
          "text": { // the text object
            "preview_url": false,
            "body": "hello"
          }
        },
        headers: {
          'Authorization': `Bearer ${process.env.Meta_WA_accessToken}`,
          'Content-Type': 'application/json'
        },
      })

      console.log(resa)*/
  
      if (typeOfMsg === 'text_message') {
        await Whatsapp.sendSimpleButtons({
            message: `Hey ${recipientName}, \nYou are speaking to a chatbot.\nWhat do you want to do next?`,
            recipientPhone: recipientPhone,
            listOfButtons: [
                {
                    title: 'View some products',
                    id: 'see_categories',
                },
                {
                    title: 'Speak to a human',
                    id: 'speak_to_human',
                },
            ],
        });
      }

    if (typeOfMsg === 'simple_button_message') {
      let button_id = incomingMessage.button_reply.id;

      if (button_id === 'speak_to_human') {
        // respond with a list of human resources
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: `Not to details:`,
        });

        await Whatsapp.sendContact({
          recipientPhone: recipientPhone,
          contact_profile: {
            addresses: [
              {
                city: 'Nairobi',
                country: 'Kenya',
              },
            ],
            name: {
              first_name: 'Daggie',
              last_name: 'Blanqx',
            },
            org: {
              company: 'Mom-N-Pop Shop',
            },
            phones: [
              {
                phone: '+1 (555) 025-3483',
              },
              {
                phone: '+254 712345678',
              },
            ],
          },
        });
      }
    }
  }

    return res.status(200)
  } catch (error) {
    console.log(error)
    return res.sendStatus(500);
  }
});

router.use('*', (req, res) => res.status(404).send('404 Not Found'));

module.exports = router;