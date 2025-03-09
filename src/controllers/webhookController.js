const { io } = require("../server");
const { sendMessage, sendInteractiveMessage } = require("../api/whatsapp");
const { set, ref, database, remove, update, get, push } = require("../api/firebase");
const { resetUserTimeout, startUserTimeout, clearUserTimeout, isWithinWorkingHours } = require("../utils/timeoutManager");
const { getChatFlow } = require("../utils/flowConfig");
const handleVehicleInquiry = require("../utils/handleVehicleInquiry");

async function endChat(number) {
  await sendMessage(number, getChatFlow("empresa_x").messages.endchat);
  remove(ref(database, 'zero/chats/' + number));
  clearUserTimeout(number);
}

async function handleChatFlow(number, userMessage, clientState, flow) {
  const updates = {};

  if (!flow[clientState.step]?.steps || clientState.currentStep >= flow[clientState.step].steps.length) {
    return await endChat(number);
  }
  
  const currentStepData = flow[clientState.step].steps[clientState.currentStep];
  clientState.answers = clientState.answers || {};
  
  if (userMessage) {
    const validation = validateInput(userMessage, currentStepData);
   
    if (!validation.isValid) return await sendMessage(number, validation.errorMessage);
    
    clientState.currentStep++;
    clientState.answers[currentStepData.key] = userMessage;
    
    updates[`zero/chats/${number}/answers`] = clientState.answers;
    updates[`zero/chats/${number}/currentStep`] = clientState.currentStep;
    await update(ref(database), updates);
  }
  
  return clientState.currentStep < flow[clientState.step].steps.length ?
    await sendMessage(number, flow[clientState.step].steps[clientState.currentStep].text) :
    await endChat(number);
}

function validateInput(input, userFlow) {
  const { validation } = userFlow;
  const regex = new RegExp(validation.regex);
  
  if (!regex.test(input)) {
    return { isValid: false, errorMessage: validation.errorMessage };
  }
  
  return { isValid: true };
}

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
    
    const flow = getChatFlow("empresa_x");
    
    // Verifica se a mensagem foi recebida fora do horário de atendimento
    if (!isWithinWorkingHours()) {
      await sendMessage(from, flow.messages.att);
      return res.sendStatus(200);
    }
    
    const chatPath = `zero/chats/${from}`;
    const snapshot = await get(ref(database, chatPath));
    let clientState = snapshot.val();
    
    resetUserTimeout(from, name, flow);
    
    // Se o cliente ainda não interagiu, envia as opções iniciais
    if (!clientState || !clientState.step) {
      await sendInteractiveMessage(from, `${flow.messages.hello} ${name}! ${flow["Inicio"].text}`, flow["Inicio"].buttons);
      
      await set(ref(database, chatPath), {
        step: "Inicio",
        inService: false,
        currentStep: 0,
        answers: {
          ok: true
        },
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
    
    if (clientState.step === "Orçamento IA" && text) {
      const findMessage = await handleVehicleInquiry(text);
      
      if (findMessage) {
        const newMessage = { sender: name, text };
        const newMessage2 = { sender: "Você", text: findMessage };
        const messagesRef = ref(database, `${chatPath}/client/messages`);
        push(messagesRef, newMessage);
        push(messagesRef, newMessage2);
        
        await sendMessage(from, findMessage);
        return res.sendStatus(200);
      }
    }
    
    // 🚫 Se o cliente está em atendimento humano, não interagir
    if (clientState?.inService) {
      io.emit("receiveMessage", { number: from, name, message: text });
      await push(ref(database, `${chatPath}/client/messages`), { sender: name, text });
      return res.sendStatus(200);
    }
    
    // Se quiser encerrar a conversa
    if (text?.includes("encerrar")) {
      await endChat(from);
      return res.sendStatus(200);
    }
    
    // 🚫 Impede escolhas fora do fluxo esperado
    if (flow[clientState.step].buttons && !flow[clientState.step]?.buttons.includes(button_title)) {
      await sendMessage(from, flow.messages.invalid);
      return res.sendStatus(200);
    }
    
    if (button_title) {
      const nextStep = flow[button_title];
      
      if (nextStep.inAttendance) updates[`${chatPath}/inService`] = true;
      
      switch (nextStep.type) {
        case "text":
          for (const textArr of nextStep.text) {
            await sendMessage(from, textArr);
          }
          break;
        case "botao":
          await sendInteractiveMessage(from, nextStep.text, nextStep.buttons);
          break;
        case "input":
          await handleChatFlow(from, text, { step: "teste", answers: {}, currentStep: 0 }, flow);
          break;
      }

      updates[`${chatPath}/step`] = button_title;
      await update(ref(database), updates);

      if (nextStep.endchat) await endChat(from)
    }
    
    if (text) await handleChatFlow(from, text, clientState, flow);
    
    return res.sendStatus(200);
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
