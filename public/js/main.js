document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".tab-button");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  const forgotPasswordForm = document.getElementById("forgot-password-form");

  buttons.forEach(button => {
    button.addEventListener("click", function () {
      // Remove a classe 'active' de todos os botões
      buttons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      // Alterna a exibição dos formulários
      if (this.dataset.tab === "login") {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        forgotPasswordForm.style.display = "none";
      } else if (this.dataset.tab === "signup") {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        forgotPasswordForm.style.display = "none";
      } else {
        this.classList.remove("active");
        loginForm.style.display = "none";
        signupForm.style.display = "none";
        forgotPasswordForm.style.display = "block";
      }
    });
  });
});