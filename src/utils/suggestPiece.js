const { studioAI } = require("../ai");

function suggestPiece(mensagem) {
  const instructions = `Você é um assistente especializado em autopeças. Baseado na solicitação do cliente, sugira a peça correta e outras marcas disponíveis. 

  Cliente: "${mensagem}"

  Exemplo da estrutura que deve ser seguida sem falar mais nada alem disso: 
  Para o Virtus 1.6 MSI 2018, o disco de freio recomendado geralmente é:

  Modelo principal: D31J
  Outras marcas disponíveis:
  Bosch - 0986AB9550
  Fremax - BD1264
  TRW - DF4463`

  const res = studioAI(instructions)
  return res;
}

// Simulação de mensagens recebidas
const mensagemCliente = "Quero um par de pastilha de freio dianteira para meu carro.";
const sugestao = suggestPiece(mensagemCliente);

console.log(sugestao); 
