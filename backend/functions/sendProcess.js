// sendProcess.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Mengambil proses terbaru dari SystemInfo yang terbaru dan memfilter berdasarkan nama atau PID.
 *
 * @param {String} [searchKey] - Kata kunci untuk mencari proses berdasarkan nama atau PID.
 * @returns {Promise<Array>} - Array dari proses yang sesuai dengan filter.
 * @throws {Error} - Jika terjadi kesalahan saat pengambilan data.
 */
async function sendProcess(searchKey) {
  try {
    // Definisikan kondisi filter untuk proses
    let processesWhere = {};

    if (searchKey && searchKey.trim() !== "") {
      const pid = parseInt(searchKey, 10);
      if (!isNaN(pid)) {
        // Jika searchKey adalah angka, filter berdasarkan pid atau nama yang mengandung searchKey
        processesWhere = {
          OR: [
            { name: { contains: searchKey, mode: "insensitive" } },
            { pid: pid },
          ],
        };
      } else {
        // Jika searchKey adalah string, filter berdasarkan nama yang mengandung searchKey
        processesWhere = {
          name: { contains: searchKey, mode: "insensitive" },
        };
      }
    }

    // Cari entri SystemInfo terbaru dengan proses yang difilter
    const latestSystemInfo = await prisma.systemInfo.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        processes: {
          where: processesWhere,
          orderBy: { createdAt: "desc" }, // Opsional: Urutkan proses berdasarkan waktu pembuatan
        },
      },
    });

    // Jika tidak ada SystemInfo ditemukan, kembalikan array kosong
    if (!latestSystemInfo) {
      return [];
    }

    // Kembalikan proses yang ditemukan
    return latestSystemInfo.processes;
  } catch (error) {
    console.error("Error fetching processes with latest data:", error);
    throw error;
  }
}

export default sendProcess;
