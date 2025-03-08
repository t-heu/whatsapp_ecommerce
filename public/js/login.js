document.addEventListener("DOMContentLoaded", function () {
  const rememberCheckbox = document.getElementById("remember");
  const usernameInput = document.getElementById("username");

  // Se houver um nome de usuário salvo, preencher automaticamente
  const savedUsername = localStorage.getItem("rememberedUsername");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    rememberCheckbox.checked = true; // Marca a caixa automaticamente
  }

  document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = usernameInput.value;
    const password = document.getElementById("password").value;

    // Se "Lembrar de mim" estiver marcado, salvar o nome de usuário
    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername"); // Remove se desmarcado
    }

    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = "/panel";
    } else {
      document.getElementById("errorMsg").textContent = result.message;
    }
  });
});
