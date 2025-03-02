require("dotenv").config();
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.set("view engine", "ejs");
app.use("/", express.static(path.join(__dirname, "../public")));

module.exports = { server, io, app };
