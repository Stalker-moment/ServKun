import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './img/assets'); // Set the destination folder for the uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep the original file name
    }
});

// Initialize multer with the defined storage
const upload = multer({ storage: storage });

router.get("/img/assets/:name", (req, res) => {
    const name = req.params.name;

    const filePath = `./img/assets/${name}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve("./img/nofound.jpg"));
    }
});

router.post("/img/assets", upload.single("image"), (req, res) => {
    const { file } = req;
    
    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    res.status(200).json({ message: "File uploaded successfully", file: file });
});

export default router;