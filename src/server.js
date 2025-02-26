require('dotenv').config()
const express = require("express");
const path = require('path');

const { v1Router } = require("./route");

const app = express();
app.use(express.json());
app.set("view engine", "ejs");
app.use('/', express.static(path.join(__dirname, '../public')));
app.use("/", v1Router)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
