const axios = require('axios')

const api = axios.create({
  baseURL: `https://graph.facebook.com/v13.0/${process.env.Meta_WA_SenderPhoneNumberId}/`,
  headers: {
    'Authorization': `Bearer ${process.env.Meta_WA_accessToken}`,
    'Content-Type': 'application/json'
  }
});

module.exports = { api }
