const clientesInteragiram = new Map(); // Armazena a escolha do cliente
const clientesEmAtendimento = new Map();

const ownerNumber = process.env.Meta_WA_SenderPhoneNumberId;
const isOwner = (from) => from === ownerNumber;

module.exports = {
  clientesInteragiram,
  isOwner,
  clientesEmAtendimento
};
