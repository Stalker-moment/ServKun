// sendCoolerLatestbyId.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Mengambil Cooler beserta CoolerData terbaru berdasarkan ID Cooler.
 *
 * @param {number} id - ID dari Cooler yang ingin diambil datanya.
 * @returns {Promise<Object|null>} Cooler dengan data terbaru atau null jika tidak ditemukan.
 * @throws {Error} Jika terjadi kesalahan saat pengambilan data.
 */

async function sendCoolerLatestbyId(id) {
  try {
    // Mengambil Cooler beserta CoolerData terbaru berdasarkan ID
    const cooler = await prisma.cooler.findUnique({
      where: { id: id },
      include: {
        coolerData: {
          orderBy: { createdAt: "desc" }, // Mengurutkan CoolerData berdasarkan createdAt secara menurun
          take: 1, // Mengambil hanya entri pertama (terbaru)
        },
      },
    });

    if (!cooler) {
      return null; // Mengembalikan null jika Cooler tidak ditemukan
    }

    // Memformat data untuk menyertakan latestData secara langsung
    const result = {
      id: cooler.id,
      name: cooler.name,
      createdAt: cooler.createdAt,
      updatedAt: cooler.updatedAt,
      latestData: cooler.coolerData[0] || null, // Mengambil entri pertama atau null jika tidak ada
    };

    return result;
  } catch (error) {
    console.error("Error fetching cooler with latest data by ID:", error);
    throw error;
  }
}

export default sendCoolerLatestbyId;
