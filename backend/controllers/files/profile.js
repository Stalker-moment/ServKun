import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './img/profile'); // Set the destination folder for the uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname)); // Set the file name and extension
    }
});

// Initialize multer with the defined storage
const upload = multer({ storage: storage });

router.get("/img/profile/:name", (req, res) => {
    const name = req.params.name;

    const filePath = `./img/profile/${name}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve('./img/nofound.jpg'));
    }
});

router.get("/img/profile", async (req, res) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.expired < Date.now()) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = decoded;

    const data = await prisma.account.findFirst({
        where: {
            id: id,
        },
        include: {
            contact: true,
        },
    });

    if (!data) {
        return res.status(404).json({ error: "Contact not found" });
    }

    data.contact.picture = data.contact.picture;

    const pathimage = `./img/profile/${data.contact.picture}`;

    if (fs.existsSync(pathimage)) {
        res.sendFile(path.resolve(pathimage));
    } else {
        res.sendFile(path.resolve('.img/profile/default.png'));
    }
});

router.post("/img/profile", upload.single("image"), async (req, res) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.expired < Date.now()) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = decoded;

    const contact = await prisma.contact.findFirst({
        where: {
            id: id,
        },
    });

    if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
    }

    const oldPicture = contact.picture;

    //get name of the uploaded file
    const newPicture = req.file.filename;

    if (!newPicture) {
        return res.status(400).json({ error: "Image is required" });
    }

    const changePicture = await prisma.contact.update({
        where: {
            id: contact.id,
        },
        data: {
            picture: "/" + newPicture,
        },
    });

    if (oldPicture && oldPicture !== "/default.png") {
        fs.unlinkSync(`./img/profile/${oldPicture}`);
    }

    const dataNew = await prisma.account.findFirst({
        where: {
            id: id,
        },
        include: {
            contact: true,
        },
    });

    if (!dataNew) {
        return res.status(404).json({ error: "Contact not found" });
    }

    dataNew.contact.picture = dataNew.contact.picture
        ? `${process.env.HOST}/files/img/profile${dataNew.contact.picture}`
        : null;

    return res.status(200).json({ message: "Profile picture updated successfully", data: dataNew });
});

router.delete("/img/profile", async (req, res) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.expired < Date.now()) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = decoded;

    const contact = await prisma.contact.findFirst({
        where: {
            id: id,
        },
    });

    if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
    }

    const oldPicture = contact.picture;

    const changePicture = await prisma.contact.update({
        where: {
            id: contact.id,
        },
        data: {
            picture: "/default.png",
        },
    });

    if (oldPicture && oldPicture !== "/default.png") {
        fs.unlinkSync(`./img/profile/${oldPicture}`);
    }

    const dataNew = await prisma.account.findFirst({
        where: {
            id: id,
        },
        include: {
            contact: true,
        },
    });

    if (!dataNew) {
        return res.status(404).json({ error: "Contact not found" });
    }

    dataNew.contact.picture = dataNew.contact.picture
        ? `${process.env.HOST}/files/img/profile${dataNew.contact.picture}`
        : null;

    return res.status(200).json({ message: "Profile picture deleted successfully", data: dataNew });
});

export default router;