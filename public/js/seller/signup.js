document.getElementById("signupForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const response = await fetch("/seller/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword })
  });

  const result = await response.json();

  if (result.success) {
    window.location.href = "/seller/panel";
  } else {
    document.getElementById("errorMsg").textContent = result.message;
  }
});