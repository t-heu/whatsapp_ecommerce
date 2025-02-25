const clientsData = new Map()

const ownerNumber = process.env.Meta_WA_SenderPhoneNumberId;
const isOwner = (from) => from === ownerNumber;

module.exports = {
  isOwner,
  clientsData
};
