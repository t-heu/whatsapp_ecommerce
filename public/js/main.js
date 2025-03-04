document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".tab-button");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  buttons.forEach(button => {
    button.addEventListener("click", function () {
      // Remove a classe 'active' de todos os botões
      buttons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      // Alterna a exibição dos formulários
      if (this.dataset.tab === "login") {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
      } else {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
      }
    });
  });
});