const session = require("express-session");
const helmet = require("helmet");

const { server, io, app } = require("./server");
const { v1Router } = require("./route");

app.set("trust proxy", 1);
app.use(helmet());
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "chave-secreta",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
    httpOnly: true, // Protege contra acesso via JS
    sameSite: "strict", // Protege contra CSRF
    maxAge: 1000 * 60 * 60 * 2 // Expira em 2 horas
  }
});
app.use(sessionMiddleware);
// Compartilhar sessão com WebSocket
io.use((socket, next) => {
  const req = socket.request;
  sessionMiddleware(req, {}, (err) => {
    if (err) return next(err);
    if (!req.session) {
      return next(new Error("Não autorizado"));
    }
    next();
  });
});
app.use("/", v1Router);

// WebSocket
io.on("connection", (socket) => {
  console.log("user connected");

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
