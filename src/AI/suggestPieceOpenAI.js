const OpenAI = require("openai");
require('dotenv').config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function suggestPiece(mensagemCliente) {
  const prompt = `Você é um assistente especializado em autopeças. Baseado na solicitação do cliente, sugira a peça correta e outras marcas disponíveis. 

Cliente: "${mensagemCliente}"
Resposta:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",//"gpt-4o",
      prompt,
      stream: true,
    });

    const sugestao = response.data.choices[0].text.trim();
    console.log("Sugestão do bot:", sugestao);
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
}
