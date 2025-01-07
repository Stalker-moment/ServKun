// sendMemoryChart.js
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

/**
 * Mengambil data memori dari SystemInfo yang dibuat hari ini dan memformatnya ke dalam struktur yang diinginkan.
 *
 * @returns {Promise<Object>} - Sebuah objek dengan array TimeChart, TotalRAM, UsedRAM, dan AvailableRAM.
 * @throws {Error} - Jika terjadi kesalahan saat pengambilan data.
 */
async function sendMemoryChart() {
    try {
        // Mendapatkan awal dan akhir hari ini
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Mengambil data SystemInfo untuk hari ini
        const systemInfoLogs = await prisma.systemInfo.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: {
                createdAt: 'asc', // Mengurutkan berdasarkan waktu pembuatan secara ascending
            },
        });

        // Memproses data menjadi format yang diinginkan
        const data = {
            TimeChart: [],
            TotalRAM: [],
            UsedRAM: [],
            AvailableRAM: [],
        };

        systemInfoLogs.forEach(log => {
            data.TimeChart.push(format(log.createdAt, 'HH:mm:ss')); // Format timestamp
            data.TotalRAM.push(log.totalRAM); // Menyimpan total RAM
            data.UsedRAM.push(log.usedRAM); // Menyimpan RAM yang terpakai
            const availableRAM = log.totalRAM - log.usedRAM;
            data.AvailableRAM.push(availableRAM); // Menghitung dan menyimpan RAM yang tersedia
        });

        // Membatasi data hanya pada 15 data terbaru
        if (data.TimeChart.length > 15) {
            data.TimeChart = data.TimeChart.slice(-15);
            data.TotalRAM = data.TotalRAM.slice(-15);
            data.UsedRAM = data.UsedRAM.slice(-15);
            data.AvailableRAM = data.AvailableRAM.slice(-15);
        }

        return data;

    } catch (error) {
        console.error("Error fetching memory chart:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

export default sendMemoryChart;