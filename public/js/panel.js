function mostrarChat(number, name) {
  document.querySelector(".chat-container").style.display = "block";
  document.getElementById("chat-number").textContent = `${name} (${number})`;
  document.getElementById("chat-number-hidden").value = number;
}

async function enviarPagamento(number) {
  const response = await fetch('/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number })
  });

  if (response.ok) {
    alert("Opções de pagamento enviadas!");
  } else {
    alert("Algo deu errado");
  }
}

async function logout() {
  const response = await fetch('/logout', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    window.location.href = "/";
  } else {
    alert("Algo deu errado");
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
    alert("Algo deu errado");
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
  }
}

async function carregarChat(number, name) {
  try {
    const response = await fetch(`/chat/${number}`);
    if (!response.ok) throw new Error("Erro ao carregar chat");

    const chatHtml = await response.text();
    document.getElementById("chat-container").innerHTML = chatHtml;
    mostrarChat(number, name)
  } catch (error) {
    alert('Erro:', error.message);
  }
}