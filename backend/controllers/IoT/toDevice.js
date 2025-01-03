import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const device_API = process.env.DEVICE_API;

const router = express.Router();
const prisma = new PrismaClient();

//import function
import sendSystemLatest from "../../functions/sendSystemLatest.js";
import sendCoolerLatest from "../../functions/sendCoolerLatest.js";

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

router.get("/data-system", authenticateDeviceAPI, async (req, res) => {
  const data = await sendSystemLatest();
  res.json(data);
});

router.get("/data-cooler", authenticateDeviceAPI, async (req, res) => {
  const data = await sendCoolerLatest();
  res.json(data);
});

export default router;
