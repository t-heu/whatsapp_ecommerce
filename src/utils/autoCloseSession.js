const { sendMessage } = require("../service");
const { clientsData } = require("./config");

const timeouts = new Map(); // Armazena os timeouts de cada cliente

// 🕒 Função para iniciar o timeout (encerra após 2 minutos)
function startTimeout(user) {
  //console.log(`[DEBUG] Iniciando timeout para ${user}`);
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo

  const timeout = setTimeout(async () => {
    //console.log(`[DEBUG] Encerrando conversa com ${user}`);
    await sendMessage(user, "Parece que você se ausentou! Encerramos a conversa para otimizar seu atendimento. Caso precise de algo, é só mandar uma mensagem! 😊");
    clientsData.delete(user); // Remove o cliente do fluxo
    timeouts.delete(user); // Remove o timeout desse usuário
  }, process.env.TIMEOUT_DURATION || 300000); // 3 minutos
  timeouts.set(user, timeout); // Salva o timeout do usuário
}

// 🔄 Função para reiniciar o timeout quando o cliente interagir
function resetTimeout(user) {
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo
  startTimeout(user); // Inicia um novo timeout
}

module.exports = {
  resetTimeout,
  startTimeout
};
