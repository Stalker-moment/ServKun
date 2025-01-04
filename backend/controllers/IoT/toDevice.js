import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const device_API = process.env.DEVICE_API;

const router = express.Router();
const prisma = new PrismaClient();

//import function
import sendSystemLatest from "../../functions/sendSystemLatest.js";
import sendCoolerLatestbyId from "../../functions/sendCoolerLatestbyId.js";

//Middleware to authenticate Device API
const authenticateDeviceAPI = (req, res, next) => {
  const { apikey } = req.body;

  if (!apikey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (apikey !== device_API) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

router.post("/data-system", authenticateDeviceAPI, async (req, res) => {
  const data = await sendSystemLatest();
  res.json(data);
});

router.post("/data-cooler", authenticateDeviceAPI, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  const data = await sendCoolerLatestbyId(id);
  res.json(data);
});

router.get("/data-clock", async (req, res) => {
  const now = new Date();

  // Format dateTime (ISO 8601)
  const dateTime = now.toISOString();

  // Format clock (HH:MM:SS)
  const clock = now.toLocaleTimeString("en-GB", { hour12: false });

  // Format date (DD:MM:YYYY)
  const day = ("0" + now.getDate()).slice(-2);
  const month = ("0" + (now.getMonth() + 1)).slice(-2); // getMonth() is 0-based
  const year = now.getFullYear();
  const date = `${day}:${month}:${year}`;

  // Mengirim data dalam format JSON
  const data = {
    dateTime,
    clock,
    date,
  };

  res.json(data);
});

export default router;
