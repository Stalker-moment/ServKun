import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function sessionWatcher(idSession) {
    try {
        if (!idSession) {
            throw new Error("Session ID is required.");
        }

        const session = await prisma.session.findUnique({
            where: {
                id: idSession,
            },
        });

        if (!session) {
            throw new Error("Session not found.");
        }

        const now = new Date();
        const sessionDate = new Date(session.date);

        if (now > sessionDate) {
            //if session is expired, delete it
            await prisma.session.delete({
                where: {
                    id: idSession,
                },
            });

            return true;
        }

        //if session is not expired, return updated lastAccessedAt
        await prisma.session.update({
            where: {
                id: idSession,
            },
            data: {
                lastAccessedAt: now,
            },
        });

        return false;
    } catch (error) {
        console.error("Error in sessionWatcher:", error.message);
        return false;
    }
}

export default sessionWatcher;
