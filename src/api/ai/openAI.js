const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function openAI(script) {
  const prompt = script;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",//"gpt-4o",
      prompt,
      stream: true,
    });

    const sugestao = response.data.choices[0].text.trim();
    return sugestao;
  } catch (error) {
    console.error("Erro ao obter sugestão:", error);
    return "Não foi possível sugerir uma peça no momento.";
  }
}

module.exports = {
  openAI
}
