import pkg from 'jsonwebtoken';
const { verify } = pkg;
import dotenv from "dotenv";
dotenv.config();

import sendDataSessionId from "../functions/sendDataSessionId.js";
import sessionWatcher from "../functions/sessionWatcher.js";

async function handleDataSessionId(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if(!token) {
        ws.send(JSON.stringify({ error: "Token is required" }));
        ws.close();7
        return;
    }

    // Verify the token
    try {
        const decoded = verify(token, process.env.JWT_SECRET);

        if(decoded.expiredAt < Date.now()) {
            ws.send(JSON.stringify({ error: "Invalid or expired token" }));
            ws.close();
            return;
        }

        var sessionId = decoded.sessionId;

        const session = sessionWatcher(sessionId);

    } catch(err) {
        ws.send(JSON.stringify({ error: "Invalid or expired token" }));
        ws.close();
        return;
    }

    let data = null;

    const sendUpdatedData = async () => {
        let newData = await sendDataSessionId(sessionId);

        if(JSON.stringify(newData) !== data) {
            data = JSON.stringify(newData);
            ws.send(data);
        }
    };

    sendUpdatedData();
    const interval = setInterval(sendUpdatedData, 1000);
    
    ws.on("close", () => {
        clearInterval(interval);
    });
}

export default handleDataSessionId;