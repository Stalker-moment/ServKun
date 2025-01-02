import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import useragent from "express-useragent";
import getIpInfo from "../../functions/getIpInfo.js";

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

router.use(useragent.express());

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const ipInfo = await getIpInfo(ip);

    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Please fill all required fields" });
        }

        const account = await prisma.account.findUnique({
            where: { email: email },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        const passwordMatch = await bcrypt.compare(password, account.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const contact = await prisma.contact.findUnique({
            where: { email: email },
        });

        if (!contact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        const expired = Date.now() + 60 * 60 * 60 * 1000; // 1 day

        let deviceType;
        if (req.useragent.isMobile) deviceType = "MOBILE";
        else if (req.useragent.isTablet) deviceType = "TABLET";
        else if (req.useragent.isDesktop) deviceType = "DESKTOP";
        else deviceType = "UNKNOWN";

        let token = "initial";

        const sessionManager = await prisma.session.create({
            data: {
                token: token,
                expiredAt: new Date(expired),
                device: deviceType,
                ip: ip,
                region: ipInfo.region,
                city: ipInfo.city,
                loc: ipInfo.loc,
                org: ipInfo.org,
                timezone: ipInfo.timezone,
                account: { connect: { id: account.id } },
            },
        });

        if (!sessionManager) {
            return res.status(400).json({ error: "Failed to create session" });
        }

        token = jwt.sign(
            {
                id: account.id,
                role: account.role,
                email: account.email,
                noReg: contact.noReg,
                expiredAt: expired,
                device: deviceType,
                sessionId: sessionManager.id,
            },
            process.env.JWT_SECRET
        );

        const goodSession = await prisma.session.update({
            where: { id: sessionManager.id },
            data: { token: token },
        });

        if (!goodSession) {
            return res.status(400).json({ error: "Failed to update session" });
        }

        return res
            .status(200)
            .json({ token, deviceType, sessionId: sessionManager.id });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.post("/logout", async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const decoded = jwt.decode(token);
        const sessionId = decoded.sessionId;

        const session = await prisma.session.findFirst({
            where: { id: sessionId },
        });

        if (!session) {
            return res
                .status(200)
                .json({ message: "Logout success, but the session loses" });
        }

        await prisma.session.delete({ where: { id: sessionId } });

        return res.status(200).json({ message: "Logout success" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.post("/remote-logout", async (req, res) => {
    const { authorization } = req.headers;
    const { sessionId } = req.body;

    try {
        if (!authorization) {
            return res.status(400).json({ error: "auth is required" });
        }

        const decoded = jwt.decode(authorization.replace("Bearer ", ""));
        const sessionNow = decoded.sessionId;

        if (sessionNow == sessionId) {
            return res.status(401).json({ error: "Cannot logout current session" });
        }

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const session = await prisma.session.findFirst({
            where: { id: sessionId },
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        await prisma.session.delete({ where: { id: sessionId } });

        return res.status(200).json({ message: "Remote logout success" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.post("/remote-logout-others", async (req, res) => {
    const { authorization } = req.headers;
    const { sessionId } = req.body;

    try {
        if (!authorization) {
            return res.status(400).json({ error: "auth is required" });
        }

        const decoded = jwt.decode(authorization.replace("Bearer ", ""));
        const sessionNow = decoded.sessionId;

        if (sessionNow == sessionId) {
            return res.status(401).json({ error: "Cannot logout current session" });
        }

        if (decoded.role !== "ADMIN") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const session = await prisma.session.findFirst({
            where: { id: sessionId },
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        await prisma.session.delete({ where: { id: sessionId } });

        return res.status(200).json({ message: "Remote logout success" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
