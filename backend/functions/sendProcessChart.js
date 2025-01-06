// sendProcessChart.js
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

/**
 * Mengambil data proses tertentu dan memformatnya ke dalam struktur yang diinginkan.
 *
 * @param {String} processName - Nama proses yang ingin dicari (misalnya, "System Idle Process").
 * @returns {Promise<Object>} - Objek dengan array TimeChart, CPUUsage, dan Memory.
 * @throws {Error} - Jika terjadi kesalahan saat pengambilan data.
 */
async function sendProcessChart(processName) {
    try {
        // Validasi input nama proses
        if (!processName || processName.trim() === "") {
            throw new Error("Nama proses tidak boleh kosong.");
        }

        // Ambil entri Process yang memiliki nama yang ditentukan, diurutkan berdasarkan createdAt ascending
        const processLogs = await prisma.process.findMany({
            where: {
                name: {
                    equals: processName,
                    mode: "insensitive", // Pencarian tidak case-sensitive
                },
            },
            orderBy: {
                createdAt: 'asc', // Urutkan berdasarkan waktu pembuatan
            },
        });

        // Proses data menjadi format yang diinginkan
        const data = {
            TimeChart: [],
            CPUUsage: [],
            Memory: [],
        };

        processLogs.forEach(log => {
            data.TimeChart.push(format(log.createdAt, 'HH:mm:ss')); // Format waktu
            data.CPUUsage.push(log.cpuUsage); // Tambahkan CPU Usage
            data.Memory.push(log.memory); // Tambahkan Memory Usage
        });

        // Filter data untuk hanya 15 data terbaru
        if (data.TimeChart.length > 15) {
            data.TimeChart = data.TimeChart.slice(-15);
            data.CPUUsage = data.CPUUsage.slice(-15);
            data.Memory = data.Memory.slice(-15);
        }

        return data;

    } catch (error) {
        console.error("Error fetching process chart:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

export default sendProcessChart;