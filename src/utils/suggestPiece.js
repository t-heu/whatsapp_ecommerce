const { studioAI } = require("../api/studioAI");

function suggestPiece(mensagem) {
  const instructions = `Você é um assistente especializado em autopeças. Seu objetivo é sugerir a peça correta e listar outras marcas disponíveis com base na solicitação do cliente.

  Responda exatamente no formato do exemplo abaixo, sem adicionar explicações, saudações ou qualquer outra informação adicional.
  Não altere a estrutura da resposta. 

  Cliente: "${mensagem}"

  Formato da resposta (obrigatório):

  Para o [veículo e ano especificado], o [nome da peça] recomendado geralmente é:

  Modelo principal: [modelo principal]
  Outras marcas disponíveis:
  [Marca 1] - [Código da peça]
  [Marca 2] - [Código da peça]
  [Marca 3] - [Código da peça]`

  const res = studioAI(instructions)
  return res;
}

// Simulação de mensagens recebidas
const mensagemCliente = "Para o Virtus 1.6 MSI 2018, o disco de freio recomendado geralmente é:";
const sugestao = suggestPiece(mensagemCliente);

console.log(sugestao); 
