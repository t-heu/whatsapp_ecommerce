const socket = io();

socket.on("receiveMessage", (data) => {
  const messagesDiv = document.getElementById("messages");

  // Criando os elementos de forma dinâmica
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const senderSpan = document.createElement("span");
  senderSpan.classList.add("sender");
  senderSpan.textContent = `${data.name}:`;

  const messageSpan = document.createElement("span");
  messageSpan.classList.add("text");
  messageSpan.textContent = data.message;

  // Adicionando os elementos ao messageDiv
  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(messageSpan);

  // Adicionando a nova mensagem à div de mensagens
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (event) => {
    if (event.target && event.target.id === "sendMessageButton") {
      sendMessage();
    }
  });
});

async function sendMessage() {
  try {
    const message = document.getElementById("messageInput").value;
    const number = document.getElementById("chat-number-hidden").value;
    
    if (!number || !message) return alert("Selecione um cliente!");

    const response = await fetch("/seller/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao enviar mensagem.");
    }

    // Criar um novo elemento para a mensagem enviada
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message", "my-message");

    const sender = document.createElement("span");
    sender.classList.add("sender");
    sender.textContent = "Você:";

    const messageText = document.createElement("span");
    messageText.classList.add("text");
    messageText.textContent = message;

    // Adicionar os elementos ao container da mensagem
    messageContainer.appendChild(sender);
    messageContainer.appendChild(messageText);

    // Adicionar a mensagem ao chat
    document.getElementById("messages").appendChild(messageContainer);

    document.getElementById("messageInput").value = "";
  } catch (e) {
    alert("Erro: " + e.message);
  }
}
