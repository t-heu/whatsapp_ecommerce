const { captureVehicle, suggests, purchaseKeywords } = require("./autoPartsKeywords");
const { suggestComplement } = require("./upsellAI");
const { suggestPiece } = require("./suggestPiece");

async function handleVehicleInquiry(text) {
  const vehicleData = captureVehicle(text);
  const foundPiece = suggests.find(item => text.includes(item));
  
  // Se o cliente não mencionou um veículo nem uma peça, retornar mensagem padrão
  if ((!vehicleData.modelo || !vehicleData.ano || !vehicleData.motor) && !foundPiece) {
    return false;
  }
  
  // Se o veículo estiver incompleto, pedir mais informações
  if (!vehicleData.modelo || !vehicleData.ano || !vehicleData.motor) {
    return "Forneça as informações completas do veículo (modelo, ano e motor).";
  }
  
  // Se a peça não for identificada, pedir para especificar melhor
  if (!foundPiece) {
    return "Não consegui identificar a peça desejada. Poderia especificar melhor?";
  }
  
  const foundKeyword = purchaseKeywords.find(keyword => text.includes(keyword));

  if (foundKeyword) {
    const textComplement = await suggestComplement(`Quero um ${foundPiece} para meu veículo.`);
    return `Antes de te passar ${foundKeyword}, que tal levar também ${textComplement}?`;
  } else {
    const textSuggest = await suggestPiece(`Precisa de ${foundPiece} para o ${vehicleData.modelo} ${vehicleData.ano} ${vehicleData.motor}.`);
    return textSuggest;
  }
}

module.exports = handleVehicleInquiry;
