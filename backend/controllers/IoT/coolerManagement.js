import express from "express";
import pkg from "jsonwebtoken";
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

// Route untuk menambahkan cooler baru
router.post("/add", authenticateJWT, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    // Create new cooler
    const cooler = await prisma.cooler.create({
      data: { name },
    });

    return res.status(201).json(cooler);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk mendapatkan semua coolers
router.get("/all", authenticateJWT, async (req, res) => {
  try {
    const coolers = await prisma.cooler.findMany({
      include: { coolerData: true }, // Menyertakan data terkait jika diperlukan
    });
    return res.status(200).json(coolers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/changeMode", authenticateJWT, async (req, res) => {
  const { coolerId, mode } = req.body;

  if (!coolerId || !mode) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  // Validasi mode
  const validModes = ["DEFAULT", "ATEMP", "ACLOCK", "MANUAL"];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: "Invalid mode value" });
  }

  try {
    const cooler = await prisma.cooler.findUnique({
      where: { id: parseInt(coolerId) },
      include: { coolerData: true },
    });

    if (!cooler) {
      return res.status(404).json({ error: "Cooler not found" });
    }

    // Update coolerData mode
    const updatedCooler = await prisma.coolerData.create({
      data: {
        coolerId: parseInt(coolerId),
        mode: mode,
        speed: cooler.coolerData[0].speed ? cooler.coolerData[0].speed : 0, // Set speed to 0 if not available
      },
    });

    return res.status(200).json(updatedCooler);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/changeSpeed", authenticateJWT, async (req, res) => {
  const { coolerId, speed } = req.body;

  if (!coolerId || speed === undefined) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const cooler = await prisma.cooler.findUnique({
      where: { id: parseInt(coolerId) },
      include: { coolerData: true },
    });

    if (!cooler) {
      return res.status(404).json({ error: "Cooler not found" });
    }

    if (cooler.coolerData[0].mode !== "MANUAL") {
      return res
        .status(400)
        .json({ error: "Cooler mode must be MANUAL to change speed" });
    }

    // Update coolerData speed
    const updatedCooler = await prisma.coolerData.create({
      data: {
        coolerId: parseInt(coolerId),
        mode: cooler.coolerData[0].mode,
        speed: parseInt(speed),
      },
    });

    return res.status(200).json(updatedCooler);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk menambahkan data cooler
router.post("/data", async (req, res) => {
  const { coolerId, mode, speed, apikey } = req.body;

  if (!apikey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verifikasi Device API
  if (apikey !== `${device_API}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!coolerId || !mode || speed === undefined) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  // Validasi mode
  const validModes = ["DEFAULT", "ATEMP", "ACLOCK", "MANUAL"];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: "Invalid mode value" });
  }

  try {
    const cooler = await prisma.cooler.findUnique({
      where: { id: parseInt(coolerId) },
    });

    if (!cooler) {
      return res.status(404).json({ error: "Cooler not found" });
    }

    const coolerData = await prisma.coolerData.create({
      data: {
        coolerId: parseInt(coolerId),
        mode: mode,
        speed: parseInt(speed),
      },
    });

    return res.status(201).json(coolerData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk mengedit nama cooler
router.put("/edit", authenticateJWT, async (req, res) => {
  const { id, newName } = req.body;

  if (!id || !newName) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    const cooler = await prisma.cooler.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cooler) {
      return res.status(404).json({ error: "Cooler not found" });
    }

    // Update cooler name
    const updatedCooler = await prisma.cooler.update({
      where: { id: parseInt(id) },
      data: { name: newName },
    });

    return res.status(200).json(updatedCooler);
  } catch (error) {
    console.error(error);
    // Cek apakah error terkait dengan unique constraint
    if (error.code === "P2002") {
      // Prisma unique constraint error code
      return res
        .status(409)
        .json({ error: "Cooler with this name already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route untuk menghapus cooler
router.delete("/delete", authenticateJWT, async (req, res) => {
  const { coolerId } = req.body;

  if (!coolerId) {
    return res.status(400).json({ error: "Please provide the coolerId" });
  }

  try {
    const cooler = await prisma.cooler.findUnique({
      where: { id: parseInt(coolerId) },
    });

    if (!cooler) {
      return res.status(404).json({ error: "Cooler not found" });
    }

    // Hapus cooler (Cascade delete akan menghapus coolerData terkait)
    await prisma.cooler.delete({
      where: { id: parseInt(coolerId) },
    });

    return res.status(200).json({ message: "Cooler deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
