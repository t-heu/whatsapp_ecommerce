function parserBody({ requestBody, currentWABA_ID }) {
  let WABA_ID = requestBody.entry[0]?.id;
  let metadata = requestBody.entry[0].changes[0].value.metadata;
  let contacts = requestBody.entry[0].changes[0].value.contacts?.length
    ? requestBody.entry[0].changes[0].value.contacts[0]
    : null;

  let message = requestBody.entry[0].changes[0].value?.messages?.length
    ? requestBody.entry[0].changes[0].value.messages[0]
    : null;

  let notificationMessage = requestBody.entry[0].changes[0].value?.statuses?.length
    ? requestBody.entry[0].changes[0].value.statuses[0]
    : null;

  const output = {
    metadata,
    contacts,
    WABA_ID,
  };

  if (notificationMessage) {
    output['isNotificationMessage'] = true;
    output['isMessage'] = false;
    output['notificationType'] = notificationMessage.status;
    
    notificationMessage['from'] = {
      name: null, //name is not available for notifications, it is only available for messages
      phone: notificationMessage.recipient_id,
    };
    output['notificationMessage'] = notificationMessage;
  } else if (message) {
    output['isNotificationMessage'] = false;
    output['isMessage'] = true;

    let msgType;

    if (message.type === 'text' && message.referral) {
      msgType = 'ad_message';
    } else if (message.type === 'text') {
      msgType = 'text_message';
    } else if (message.type === 'sticker') {
      msgType = 'sticker_message';
    } else if (message.type === 'image') {
      msgType = 'media_message';
    } else if (message.location) {
      msgType = 'location_message';
    } else if (message.contacts) {
      msgType = 'contact_message';
    } else if (message.type === 'button') {
      msgType = 'quick_reply_message';
    } else if (message.type === 'interactive') {
      if (message.interactive?.type === 'list_reply') {
        msgType = 'radio_button_message';
        message['list_reply'] = message.interactive.list_reply;
      } else if (message.interactive?.type === 'button_reply') {
        msgType = 'simple_button_message';
        message['button_reply'] = message.interactive.button_reply;
      }
    } else if (message.type === 'unsupported') {
      msgType = 'unknown_message';
      
      if (message.errors?.length) {
        console.log({ Q: message.errors });
        output['isNotificationMessage'] = true;
        output['isMessage'] = false;
        notificationMessage = {
          errors: message.errors,
        };
      }
    }
    
    message['type'] = msgType;
    message['from'] = {
      name: contacts.profile.name,
      phone: message?.from,
    };

    if (output.isMessage) {
      let thread = null;

      if (message.context) {
        thread = {
          from: {
            name: null,
            phone: message.context?.from,
            message_id: message.context?.id,
          },
        };
      }

      output['message'] = {
        ...message,
        thread,
        message_id: message.id || null,
      };

      delete output.message.id; //keep the data light
      delete output.context; //keep the data light
    }
  } else {
    console.warn('An unidentified.');
  }

  return output;
};

module.exports = {parserBody}