document.getElementById("signupForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const companyName = document.getElementById("companyName").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword, companyName })
  });

  const result = await response.json();

  if (result.success) {
    window.location.href = "/dash";
  } else {
    document.getElementById("errorMsg").textContent = result.message;
  }
});