const { sendMessage } = require("../api/whatsapp");
const { ref, database, remove } = require("../api/firebase");
const { getFlowConfig } = require("../utils/configLoader");
const empresa = "empresa_x";
const flow = getFlowConfig(empresa);

const timeouts = new Map(); // Armazena os timeouts de cada cliente

// 🕒 Função para iniciar o timeout (encerra após 2 minutos)
function startTimeout(user) {
  //console.log(`[DEBUG] Iniciando timeout para ${user}`);
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo

  const timeout = setTimeout(async () => {
    //console.log(`[DEBUG] Encerrando conversa com ${user}`);
    await sendMessage(user, flow.absent[0]);
    remove(ref(database, 'zero/chats/' + user)) // Remove o cliente do fluxo
    timeouts.delete(user); // Remove o timeout desse usuário
  }, process.env.TIMEOUT_DURATION || 300000); // 3 minutos
  timeouts.set(user, timeout); // Salva o timeout do usuário
}

// 🔄 Função para reiniciar o timeout quando o cliente interagir
function resetTimeout(user) {
  if (timeouts.has(user)) clearTimeout(timeouts.get(user)); // Limpa timeout antigo
  startTimeout(user); // Inicia um novo timeout
}

// ❌ Função para parar o timeout de um usuário
function stopTimeout(user) {
  if (timeouts.has(user)) {
    clearTimeout(timeouts.get(user)); // Cancela o timeout ativo
    timeouts.delete(user); // Remove do Map
  }
}

module.exports = {
  resetTimeout,
  startTimeout,
  stopTimeout
};
