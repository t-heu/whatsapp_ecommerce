const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.STUDIOAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function studioAI(script) {
  const prompt = script;

  try {
    const result = await model.generateContent(prompt);
    const sugestao = result.response.text().trim();
    
    return sugestao;
  } catch (error) {
    console.error("Erro ao obter sugestão:", error);
    return "Não foi possível sugerir uma peça no momento.";
  }
}

module.exports = {
  studioAI
};
