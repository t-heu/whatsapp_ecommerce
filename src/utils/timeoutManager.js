const { sendMessage } = require("../api/whatsapp");
const { ref, database, remove } = require("../api/firebase");

const timeouts = new Map();
const atendimentoInicio = 7 * 60 + 30; // 7:30 em minutos
const atendimentoFim = 17 * 60 + 30; // 17:30 em minutos

// 🕒 Função para iniciar o timeout (encerra após 2 minutos)
function startUserTimeout(number, name, flow) {
  //console.log(`[DEBUG] Iniciando timeout para ${number}`);
  if (timeouts.has(number)) clearTimeout(timeouts.get(number)); // Limpa timeout antigo

  const timeout = setTimeout(async () => {
    //console.log(`[DEBUG] Encerrando conversa com ${number}`);
    await sendMessage(number, `${flow.absent[0]}${name}${flow.absent[1]}`);
    remove(ref(database, 'zero/chats/' + number))
    timeouts.delete(number);
  }, process.env.TIMEOUT_DURATION || 300000); // 3 minutos
  timeouts.set(number, timeout);
}

// 🔄 Função para reiniciar o timeout quando o cliente interagir
function resetUserTimeout(number) {
  if (timeouts.has(number)) clearTimeout(timeouts.get(number));
  startUserTimeout(number);
}

// ❌ Função para parar o timeout de um usuário
function clearUserTimeout(number) {
  if (timeouts.has(number)) {
    clearTimeout(timeouts.get(number));
    timeouts.delete(number);
  }
}

function isWithinWorkingHours() {
  const agora = new Date();
  const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();
  return minutosAtuais >= atendimentoInicio && minutosAtuais <= atendimentoFim;
}

module.exports = {
  resetUserTimeout,
  startUserTimeout,
  clearUserTimeout,
  isWithinWorkingHours
};
