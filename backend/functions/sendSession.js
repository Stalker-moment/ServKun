import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function sendSession(idAccount, idSession) {
    try {
        // Validasi input
        if (!idAccount || !idSession) {
            throw new Error("Both idAccount and idSession are required.");
        }
        if (typeof idAccount !== "string" || typeof idSession !== "string") {
            throw new Error("idAccount and idSession must be strings.");
        }

        // Fetch account data with relations
        const account = await prisma.account.findUnique({
            where: {
                id: idAccount,
            },
            include: {
                contact: true,
                sessions: true,
            },
        });

        if (!account) {
            throw new Error("Account not found.");
        }

        // Tambahkan sessionNow secara manual
        const accountWithSessionNow = {
            ...account,
            sessionNow: idSession,
        };

        // Hapus field sensitif
        delete accountWithSessionNow.password;
        delete accountWithSessionNow.role;

        // Modifikasi URL gambar jika ada
        if (accountWithSessionNow.contact?.picture) {
            accountWithSessionNow.contact.picture = `${process.env.HOST}/files/img/profile/${accountWithSessionNow.contact.picture}`;
        }

        // Seleksi sesi yang belum expired
        const now = new Date();
        const validSessions = accountWithSessionNow.sessions.filter(
            (session) => new Date(session.expiredAt) > now
        );

        // Hapus sesi yang expired dari database jika ada perbedaan
        const expiredSessionIds = accountWithSessionNow.sessions
            .filter((session) => !validSessions.includes(session))
            .map((session) => session.id);

        if (expiredSessionIds.length > 0) {
            await prisma.session.deleteMany({
                where: {
                    id: {
                        in: expiredSessionIds,
                    },
                },
            });
        }

        // Perbarui data sesi di akun
        accountWithSessionNow.sessions = validSessions;

        return { account: accountWithSessionNow };
    } catch (error) {
        console.error("Error in sendSession:", error.message);
        throw error;
    }
}
