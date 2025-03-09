document.addEventListener("DOMContentLoaded", function () {
  const rememberCheckbox = document.getElementById("remember");
  const usernameInput = document.getElementById("username");
  const companyInput = document.getElementById("company");

  // Se houver um nome de usuário salvo, preencher automaticamente
  const saved = localStorage.getItem("rememberedUsername");
  if (saved) {
    usernameInput.value = saved.username;
    companyInput.value = saved.company;
    rememberCheckbox.checked = true; // Marca a caixa automaticamente
  }

  document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = usernameInput.value;
    const company = companyInput.value
    const password = document.getElementById("password").value;

    // Se "Lembrar de mim" estiver marcado, salvar o nome de usuário
    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedUsername", {username, company});
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    const response = await fetch("/seller/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, company })
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = "/seller/panel";
    } else {
      document.getElementById("errorMsg").textContent = result.message;
    }
  });
});
