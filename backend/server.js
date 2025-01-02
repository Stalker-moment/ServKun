// Import Modul
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws"; // Perubahan di sini
import fs from "fs";
import path from "path";
import http from "http";
import cronjob from "node-cron";
import pkg from "jsonwebtoken";
const { verify } = pkg;

// Konfigurasi dotenv
dotenv.config();

// Import Controller dan Socket
import usersLogin from "./controllers/users/login.js";
import usersRegister from "./controllers/users/register.js";
import userEdit from "./controllers/users/edit.js";
import userAccount from "./controllers/users/account.js";

import filesAssets from "./controllers/files/assets.js";
import filesProfile from "./controllers/files/profile.js";
import notification from "./controllers/internal/notification.js";

import sensorManagement from "./controllers/IoT/sensorManagement.js";
import coolerManagement from "./controllers/IoT/coolerManagement.js";

import handleDataAccountsSocket from "./sockets/dataAccounts.js";
import handleDataSessionId from "./sockets/dataSessionId.js";
import handleDataSessionAccount from "./sockets/dataSessionAccount.js";
import handleDataSystemLatest from "./sockets/dataSystemLatest.js";
import handleDataSensor from "./sockets/dataSensor.js";
import handleDataCooler from "./sockets/dataCooler.js";

// Import Function
import getAndSaveAllSystemInfo from "./functions/getSystems.js";

// Running Cronjob
cronjob.schedule("*/10 * * * * *", async () => {
  await getAndSaveAllSystemInfo();
});

// Inisialisasi Express
const app = express();

//-----------------Configuration------------------//
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json({ limit: "500000mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.enable("trust proxy");
app.set("view engine", "ejs");

const PORT = process.env.PORT || 1777;

//-----------------Routes------------------//

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the API", status: 200 });
});

//===============[User Routes]=================//
app.use("/api/users", usersLogin);
app.use("/api/users", usersRegister);
app.use("/api/users", userEdit);
app.use("/api/users", userAccount);

//===============[Internal Routes]=================//
app.use("/api/internal", notification);

//===============[File Routes]=================//
app.use("/files", filesAssets);
app.use("/files", filesProfile);

//===============[IoT Routes]=================//
app.use("/api/sensor", sensorManagement);
app.use("/api/cooler", coolerManagement);

// Handler jika route tidak ditemukan
app.use((req, res) => {
  res.status(404).send({ error: "Not found" });
});

// Setup WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // Perubahan di sini

// Setup WebSocket connections
wss.on("connection", (ws, req) => {
  if (req.url.startsWith("/accounts")) {
    handleDataAccountsSocket(ws, req);
  } else if (req.url.startsWith("/dataSessionId")) {
    handleDataSessionId(ws, req);
  } else if (req.url.startsWith("/dataSessionAccount")) {
    handleDataSessionAccount(ws, req);
  } else if (req.url.startsWith("/dataSystemLatest")) {
    handleDataSystemLatest(ws, req);
  } else if(req.url.startsWith("/dataSensor")) {
    handleDataSensor(ws, req);
  } else if(req.url.startsWith("/dataCooler")) {
    handleDataCooler(ws, req);
  } else {
    ws.send(JSON.stringify({ error: "Invalid request URL" }));
    ws.close();
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});