document.getElementById("forgotPasswordForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const username = document.getElementById("forgotPasswordUsername").value;

  const response = await fetch("/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const result = await response.json();

  if (result.success) {
    alert(result.message);
    window.location.href = "/";
  } else {
    document.getElementById("errorMsg").textContent = result.message;
  }
});