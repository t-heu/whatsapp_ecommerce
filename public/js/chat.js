async function sendMessage() {
  try {
    const message = document.getElementById("messageInput").value;
    const number = document.getElementById("chat-number-hidden").value;
    
    if (!number || !message) return alert("Selecione um cliente!");

    const response = await fetch("/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao enviar mensagem.");
    }

    document.getElementById("messages").innerHTML += `
      <div class="message my-message">
        <span class="sender">Você:</span>
        <span class="text">${message}</span>
      </div>
    `;
    document.getElementById("messageInput").value = "";
  } catch (e) {
    alert("Erro: " + e.message);
  }
}