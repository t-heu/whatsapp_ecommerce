const { studioAI } = require("../ai");

async function suggestComplement(mensagem) {
  const instructions = `
    Você é um assistente especializado em autopeças. Seu objetivo é sugerir itens complementares com base na peça mencionada pelo cliente.

    Responda apenas com o nome da peça sugerida.
    Não inclua explicações, saudações ou frases adicionais

    Cliente: "${mensagem}"
  `;

  const res = await studioAI(instructions)
  return `${res} 😉? Posso verificar o estoque para você!`;
}

module.exports = { suggestComplement }

// Simulação de mensagens recebidas
//const mensagemCliente = "Quero um par de pastilha de freio dianteira para meu carro.";
//suggestComplement(mensagemCliente); // Disco de freio dianteiro
