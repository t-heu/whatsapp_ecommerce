const session = require("express-session");

const { server, io, app } = require("./server");
const { v1Router } = require("./route"); // Agora importa `v1Router` depois de `io`

app.use(session({
  secret: "chave-secreta", // Mude para uma chave mais segura
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));
app.use("/", v1Router); // Agora `v1Router` pode usar `io`

// WebSocket
io.on("connection", (socket) => {
  console.log("Novo usuário conectado ao painel");

  socket.on("sendMessage", async ({ number, message }) => {
    await sendMessage(number, message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Iniciar servidor HTTP na porta correta
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
