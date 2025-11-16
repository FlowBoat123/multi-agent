require("dotenv").config();
const express = require('express');
const serverConfig = require("./app");

const app = express();

serverConfig(app);