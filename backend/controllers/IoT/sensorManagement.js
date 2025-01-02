import express from "express";
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const device_API = process.env.DEVICE_API;
const jwtSecret = process.env.JWT_SECRET;

const router = express.Router();
const prisma = new PrismaClient();

// Middleware untuk autentikasi JWT
const authenticateJWT = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const decoded = verify(token, jwtSecret);

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(401).json({ error: "Token expired" });
    }

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Route untuk menambahkan sensor baru
router.post("/add", authenticateJWT, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const envTemp = await prisma.envTemp.create({
      data: { name },
    });

    return res.status(201).json(envTemp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk mendapatkan semua sensor
router.get("/all", authenticateJWT, async (req, res) => {
  try {
    const sensors = await prisma.envTemp.findMany({
      include: { envTempData: true },
    });
    return res.status(200).json(sensors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk menambahkan data lingkungan
router.post("/data", async (req, res) => {
  const { sensorId, temp, humi, apikey } = req.body;

  if (!apikey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verifikasi Device API
  if (apikey !== `${device_API}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!sensorId || temp === undefined || humi === undefined) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const sensor = await prisma.envTemp.findUnique({
      where: { id: sensorId },
    });

    if (!sensor) {
      return res.status(404).json({ error: "Sensor not found" });
    }

    const data = await prisma.envTempData.create({
      data: {
        envTempId: sensorId,
        temperature: temp,
        humidity: humi,
      },
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk mengedit sensor
router.put("/edit", authenticateJWT, async (req, res) => {
  const { sensorId, name } = req.body;

  if (!sensorId || !name) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const sensor = await prisma.envTemp.findUnique({
      where: { id: sensorId },
    });

    if (!sensor) {
      return res.status(404).json({ error: "Sensor not found" });
    }

    const updatedSensor = await prisma.envTemp.update({
      where: { id: sensorId },
      data: { name },
    });

    return res.status(200).json(updatedSensor);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk menghapus sensor
router.delete("/delete", authenticateJWT, async (req, res) => {
  const { sensorId } = req.body;

  if (!sensorId) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const sensor = await prisma.envTemp.findUnique({
      where: { id: sensorId },
    });

    if (!sensor) {
      return res.status(404).json({ error: "Sensor not found" });
    }

    await prisma.$transaction([
      prisma.envTempData.deleteMany({ where: { envTempId: sensorId } }),
      prisma.envTemp.delete({ where: { id: sensorId } }),
    ]);

    return res.status(200).json({ message: "Sensor deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;