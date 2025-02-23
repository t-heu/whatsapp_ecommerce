const { sendMessage } = require("../service");
const { clientesInteragiram } = require("./config");

const timeouts = new Map(); // Armazena os timeouts de cada cliente

// 🕒 Função para iniciar o timeout (encerra após 2 minutos)
function iniciarTimeout(user) {
  //console.log(`[DEBUG] Iniciando timeout para ${user}`);
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo

  const timeout = setTimeout(async () => {
    //console.log(`[DEBUG] Encerrando conversa com ${user}`);
    await sendMessage(user, "Parece que você se ausentou! Encerramos a conversa para otimizar seu atendimento. Caso precise de algo, é só mandar uma mensagem! 😊");
    clientesInteragiram.delete(user); // Remove o cliente do fluxo
    timeouts.delete(user); // Remove o timeout desse usuário
  }, process.env.TIMEOUT_DURATION || 300000); // 3 minutos
  timeouts.set(user, timeout); // Salva o timeout do usuário
}

// 🔄 Função para reiniciar o timeout quando o cliente interagir
function reiniciarTimeout(user) {
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo
  iniciarTimeout(user); // Inicia um novo timeout
}

module.exports = {
  reiniciarTimeout,
  iniciarTimeout
};
