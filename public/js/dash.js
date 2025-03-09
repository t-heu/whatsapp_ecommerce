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
