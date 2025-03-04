function mostrarChat(messages, number, name) {
  document.querySelector(".chat-container").style.display = "flex";
  document.getElementById("chat-number").textContent = `Atendimento para ${name} (${number.replace(/^55(\d{2})(\d{4})(\d{4})$/, "+55 ($1) $2-$3").replace(/^55(\d{2})(\d{5})(\d{4})$/, "+55 ($1) $2-$3")})`;

  Object.values(messages).forEach((msg) => {
    const messagesDiv = document.getElementById("messages");

    // Criando os elementos de forma dinâmica
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    // Se o sender for 'Você', adiciona a classe 'my-message'
    if (msg.sender === 'Você') {
      messageDiv.classList.add("my-message");
    }

    const sender = document.createElement("span");
    sender.classList.add("sender");
    sender.textContent = `${msg.sender}:`;

    const messageText = document.createElement("span");
    messageText.classList.add("text");
    messageText.textContent = msg.text;

    messageDiv.appendChild(sender);
    messageDiv.appendChild(messageText);

    // Adicionar a mensagem ao chat
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  const chatInputContainer = document.querySelector(".chat-input");
  if (number) {
    chatInputContainer.style.display = "flex";  // Exibe o campo de entrada
  } else {
    chatInputContainer.style.display = "none";  // Esconde o campo de entrada caso não haja número
  }

  document.getElementById("chat-number-hidden").value = number;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".action-btn").forEach(button => {
    button.addEventListener("click", function () {
      const action = this.dataset.action;
      const number = this.dataset.number;
      const name = this.dataset.name;
      
      switch (action) {
        case "pagamento":
          enviarPagamento(number);
          break;
        case "encerrar":
          encerrarAtendimento(number);
          break;
        case "atender":
          atenderCliente(number, name);
          break;
        default:
          console.log("Ação não definida.");
      }
    });
  });

  document.querySelector("#logout").addEventListener("click", async () => logout());
});

async function enviarPagamento(number) {
  try {
    const response = await fetch('/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number })
    });

    if (response.ok) {
      alert("Opções de pagamento enviadas!");
    } else {
      alert("Algo deu errado.");
      console.error("Erro ao processar: ", response.statusText);
    }
  } catch (error) {
    alert("Algo deu errado.");
    console.error("Erro ao processar: ", error.message);
  }
}

async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
    });
    
    if (response.ok) {
      window.location.href = "/";
    } else {
      alert("Algo deu errado.");
      console.error("Erro ao processar: ", response.statusText);
    }
  } catch (error) {
    alert("Algo deu errado.");
    console.error("Erro ao processar: ", error.message);
  }
}

async function encerrarAtendimento(number) {
  const response = await fetch('/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number })
  });

  if (response.ok) {
    alert("Atendimento encerrado!");
  } else {
    alert("Algo deu errado ao carregar o chat.");
    console.error("Erro ao processar: ", error.message);
  }
}

async function atenderCliente(number, name) {
  const response = await fetch('/attend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, seller: 'Vend. A' })
  });
        
  if (response.ok) {
    carregarChat(number, name)
  } else {
    alert("Ja esta sendo atendido");
    console.error("Erro ao processar: ", error.message);
  }
}

async function carregarChat(number, name) {
  try {
    const response = await fetch(`/chat/${number}`);

    if (!response.ok) throw new Error("Erro ao carregar chat");
    
    const data = await response.json();
    
    mostrarChat(data.messages, number, name);
  } catch (error) {
    alert("Algo deu errado ao carregar o chat.");
    console.error("Erro ao carregar o chat: ", error.message);
  }
}
