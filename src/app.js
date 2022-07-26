require('dotenv').config()
const express = require('express');

let routes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);

module.exports = { app };
