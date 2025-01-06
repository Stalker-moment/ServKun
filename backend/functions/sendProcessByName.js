// sendProcessByName.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Mengambil semua proses yang memiliki nama tertentu dari seluruh SystemInfo yang ada di database.
 *
 * @param {String} fixedName - Nama proses yang ingin dicari.
 * @returns {Promise<Array>} - Array dari proses yang sesuai dengan nama yang diberikan.
 * @throws {Error} - Jika terjadi kesalahan saat pengambilan data.
 */
async function sendProcessByName(fixedName) {
  try {
    // Validasi input nama
    if (!fixedName || fixedName.trim() === "") {
      throw new Error("Nama proses tidak boleh kosong.");
    }

    // Cari semua entri SystemInfo yang memiliki proses dengan nama yang sama
    const processes = await prisma.process.findMany({
      where: {
        name: {
          equals: fixedName,
          mode: "insensitive", // Opsional: agar pencarian tidak case-sensitive
        },
      },
      include: {
        systemInfo: false, // Sertakan data terkait dari SystemInfo jika diperlukan
      },
      orderBy: {
        createdAt: "desc", // Urutkan berdasarkan waktu pembuatan jika diperlukan
      },
    });

    return processes;
  } catch (error) {
    console.error("Error fetching processes by name:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default sendProcessByName;
