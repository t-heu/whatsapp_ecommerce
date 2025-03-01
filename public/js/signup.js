document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword })
  });

  const result = await response.json();

  if (result.success) {
    window.location.href = "/panel"; // Redireciona para a página home
  } else {
    document.getElementById("errorMsg").textContent = result.message;
  }
});