import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

router.put("/edit", async (req, res) => {
    const { password, firstName, lastName, phone, noReg } = req.body;
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
                email: decoded.email,
            },
            include: {
                contact: true,
            },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        let role = account.role;
        let hashedPassword = account.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let firstNamed = account.contact.firstName;
        if (firstName) {
            firstNamed = firstName;
        }

        let lastNamed = account.contact.lastName;
        if (lastName) {
            lastNamed = lastName;
        }

        let phoned = account.contact.phone;
        if (phone) {
            phoned = phone;
        }

        let noReged = account.contact.noReg;
        if (noReg) {
            noReged = noReg;
        }

        const updatedAccount = await prisma.account.update({
            where: {
                email: decoded.email,
            },
            data: {
                password: hashedPassword,
                role: role,
                contact: {
                    update: {
                        firstName: firstNamed,
                        lastName: lastNamed,
                        phone: phoned,
                        noReg: noReged,
                    },
                },
            },
        });

        if (!updatedAccount) {
            return res.status(500).json({ error: "Failed to update account" });
        }

        if (password) {
            return res
                .status(201)
                .json({ message: `Succes update account and password` });
        }

        const updatedAccount2 = await prisma.account.findUnique({
            where: {
                email: decoded.email,
            },
            include: {
                contact: true,
                sessions: true,
            },
        });

        updatedAccount2.contact.picture = account.contact.picture
            ? `${process.env.HOST}/files/img/profile${account.contact.picture}`
            : null;

        const expired = Date.now() + 60 * 60 * 60 * 1000;

        const newToken = jwt.sign(
            {
                id: updatedAccount2.id,
                firstName: updatedAccount2.contact.firstName,
                lastName: updatedAccount2.contact.lastName,
                role: updatedAccount2.role,
                email: updatedAccount2.email,
                phone: updatedAccount2.contact.phone,
                noReg: updatedAccount2.contact.noReg,
                device: decoded.device,
                sessionId: decoded.sessionId,
                expired: expired,
            },
            process.env.JWT_SECRET
        );

        return res.status(200).json({
            message: `Succes update account (${decoded.email})`,
            token: newToken,
            data: updatedAccount2,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/edit/others", async (req, res) => {
    const { email, password, firstName, lastName, phone, noreg } = req.body;
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

        if (decoded.role !== "ADMIN") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const account = await prisma.account.findUnique({
            where: {
                email: email,
            },
            include: {
                contact: true,
            },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        let role = account.role;
        let hashedPassword = account.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let firstNamed = account.contact.firstName;
        if (firstName) {
            firstNamed = firstName;
        }

        let lastNamed = account.contact.lastName;
        if (lastName) {
            lastNamed = lastName;
        }

        let phoned = account.contact.phone;
        if (phone) {
            phoned = phone;
        }

        let noReg = account.contact.noReg;
        if (noreg) {
            noReg = noreg;
        }

        const updatedAccount = await prisma.account.update({
            where: {
                email: email,
            },
            data: {
                password: hashedPassword,
                role: role,
                contact: {
                    update: {
                        firstName: firstNamed,
                        lastName: lastNamed,
                        phone: phoned,
                        noReg: noReg,
                    },
                },
            },
        });

        if (!updatedAccount) {
            return res.status(500).json({ error: "Failed to update account" });
        }

        if (password) {
            return res
                .status(201)
                .json({ message: `Succes update account and password` });
        }

        return res.status(200).json({
            message: `Succes update account (${email}) by (${decoded.email})`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/edit/delete", async (req, res) => {
    const { email } = req.body;
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

        if (decoded.role !== "ADMIN") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (email === decoded.email) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }

        const account = await prisma.account.findUnique({
            where: { email: email },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        await prisma.contact.delete({
            where: { id: account.id },
        });

        const deletedAccount = await prisma.account.delete({
            where: { email: email },
        });

        return res.status(200).json({
            message: `Succes delete account (${email}) by (${decoded.email})`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/edit/password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;
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
            where: { email: decoded.email },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        const match = await bcrypt.compare(oldPassword, account.password);

        if (!match) {
            return res.status(400).json({ error: "Invalid old password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedAccount = await prisma.account.update({
            where: { email: decoded.email },
            data: { password: hashedPassword },
        });

        return res.status(200).json({
            message: `Succes update password for account (${decoded.email})`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
