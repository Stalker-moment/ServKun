import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

router.post("/account/all", async (req, res) => {
    const { authorization } = req.headers;

    try {
        if (!authorization) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.expired < Date.now()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let accounts = await prisma.account.findMany({
            include: {
                contact: true,
            },
        });

        const pictureContact = accounts.map((account) => {
            return {
                ...account,
                contact: {
                    ...account.contact,
                    picture: account.contact.picture
                        ? `${process.env.HOST}/files/img/profile${account.contact.picture}`
                        : null,
                },
            };
        });

        accounts = pictureContact.map((account) => {
            delete account.password;
            return account;
        });

        return res.status(200).json(accounts);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/account", async (req, res) => {
    const { authorization } = req.headers;

    try {
        if (!authorization) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.expired < Date.now()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const account = await prisma.account.findUnique({
            where: {
                id: decoded.id,
            },
            include: {
                contact: true,
            },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        delete account.password;

        account.contact.picture = account.contact.picture
            ? `${process.env.HOST}/files/img/profile${account.contact.picture}`
            : null;

        return res.status(200).json(account);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/token/validator", async (req, res) => {
    const { authorization } = req.headers;

    try {
        if (!authorization) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (decoded.role !== "ADMIN") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (decoded.expired < Date.now()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        return res.status(200).json({ message: "Token is valid" });
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }
});

router.post("/token/info", async (req, res) => {
    const { authorization } = req.headers;

    try {
        if (!authorization) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.expired < Date.now()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const account = await prisma.account.findUnique({
            where: {
                id: decoded.id,
            },
            include: {
                contact: true,
            },
        });

        delete account.password;

        account.contact.picture = account.contact.picture
            ? `${process.env.HOST}/files/img/profile${account.contact.picture}`
            : null;

        return res.status(200).json(account);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
