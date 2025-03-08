const { io } = require("../server");
const { sendMessage, sendInteractiveMessage } = require("../api/whatsapp");
const { set, ref, database, remove, update, get, push } = require("../api/firebase");
const { resetUserTimeout, startUserTimeout, clearUserTimeout, isWithinWorkingHours } = require("../utils/timeoutManager");
const { getChatFlow } = require("../utils/flowConfig");
const handleVehicleInquiry = require("../utils/handleVehicleInquiry");

exports.receiveMessage = async (req, res) => {
  try {
    const updates = {};
    const body = req.body;
    if (!body.object) return res.sendStatus(404);

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const name = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0].profile?.name;
    const from = message.from;
    const text = message.text?.body?.toLowerCase();
    const button_title = message.interactive?.button_reply.title;
    //const button_id = message.interactive?.button_reply.id;
    //const button_key = `${button_id}_${button_title}`;

    if (text?.length > 500) return res.sendStatus(400); // Evita mensagens muito longas  
    if (!/^[\p{L}0-9\s!?.,]+$/u.test(text)) return res.sendStatus(400); // Permite apenas caracteres seguros

    const flow = getChatFlow("empresa_x");

    // Verifica se a mensagem foi recebida fora do horário de atendimento
    if (!isWithinWorkingHours()) {
      await sendMessage(from, flow.att[0]);
      return res.sendStatus(200);
    }

    const snapshot = await get(ref(database, `zero/chats/${from}`));
    let clientState = snapshot.val();

    resetUserTimeout(from);

    // Se o cliente ainda não interagiu, envia as opções iniciais
    if (!clientState || !clientState.step) {
      await sendInteractiveMessage(from, `${flow["Inicio"].text[0]} ${name}! ${flow["Inicio"].text[1]}`, flow["Inicio"].buttons[0].opcoes);

      await set(ref(database, 'zero/chats/' + from), {
        step: "Inicio",
        inService: false,
        client: {
          number: String(from),
          name,
          seller: '',
          messages: new Array()
        }
      })

      startUserTimeout(from, name, flow);
      return res.sendStatus(200);
    }

    if (clientState.step === "Inicio" && text) {
      const resFind = await handleVehicleInquiry(text);

      if (resFind) {
        const newMessage = { sender: name, text };
        const newMessage2 = { sender: "Você", text: resFind };
        const messagesRef = ref(database, `zero/chats/${from}/client/messages`);
        push(messagesRef, newMessage);
        push(messagesRef, newMessage2);
        
        await sendMessage(from, resFind);
        return res.sendStatus(200);
      }
    }

    // 🚫 Se o cliente está em atendimento humano, não interagir
    if (clientState?.inService) {
      io.emit("receiveMessage", { number: from, name, message: text });
      await push(ref(database, `zero/chats/${from}/client/messages`), { sender: name, text });
      return res.sendStatus(200); // 🚫 Sai do fluxo imediatamente
    }  

    // Se quiser encerrar a conversa
    if (text?.includes("encerrar")) {
      await sendMessage(from, flow.endchat[0]);
      remove(ref(database, 'zero/chats/' + from));
      clearUserTimeout(from);
      return res.sendStatus(200);
    }

    // 🚫 Impede escolhas fora do fluxo esperado
    if (!button_title || !flow[clientState.step]?.buttons?.[0]?.opcoes.includes(button_title)) {
      await sendMessage(from, flow.invalid[0]);
      return res.sendStatus(200);
    }

    const nextStep = flow[button_title];

    if (nextStep.type === "text") {
      nextStep.text.forEach(async (textArr) => await sendMessage(from, textArr));
      if (nextStep.inAttendance) updates['zero/chats/' + from + '/inService'] = true;
      if (nextStep.endchat) {
        remove(ref(database, 'zero/chats/' + from));
        clearUserTimeout(from);
      }
    } else if (nextStep.type === "botao") {
      updates[`zero/chats/${from}/step`] = button_title;
      if (nextStep.inAttendance) updates['zero/chats/' + from + '/inService'] = true;
      await sendInteractiveMessage(from, nextStep.text[0], nextStep.buttons[0].opcoes);
    }

    update(ref(database), updates);
  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.sendStatus(200);
  }
};

exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN_SECRET;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};
