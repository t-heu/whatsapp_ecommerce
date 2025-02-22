const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.STUDIOAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function suggestPiece(mensagemCliente) {
  const prompt = `Você é um assistente especializado em autopeças. Baseado na solicitação do cliente, sugira a peça correta e outras marcas disponíveis. 

  Cliente: "${mensagemCliente}"

  Exemplo da estrutura que deve ser seguida sem falar mais nada alem disso: 
  Para o Virtus 1.6 MSI 2018, o disco de freio recomendado geralmente é:

  Modelo principal: D31J
  Outras marcas disponíveis:
  Bosch - 0986AB9550
  Fremax - BD1264
  TRW - DF4463`;

  try {
    const result = await model.generateContent(prompt);
    const sugestao = result.response.text().trim();
    return sugestao;
  } catch (error) {
    console.error("Erro ao obter sugestão:", error);
    return "Não foi possível sugerir uma peça no momento.";
  }
}

// Exemplo de uso
//suggestPiece("Preciso de um disco de freio para Polo 1.0 2018").then(console.log);
//suggestPiece("Preciso de um disco de freio para virtus 1.6 msi 2018").then(console.log);

module.exports = {
  suggestPiece
};
