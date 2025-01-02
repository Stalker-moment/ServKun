// sendCoolerLatest.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Mengambil semua Cooler beserta CoolerData terbaru untuk masing-masing Cooler.
 *
 * @returns {Promise<Array>} Array of coolers dengan data terbaru mereka.
 * @throws {Error} Jika terjadi kesalahan saat pengambilan data.
 */

async function sendCoolerLatest() {
  try {
    // Mengambil semua Cooler beserta CoolerData terbaru
    const coolers = await prisma.cooler.findMany({
      include: {
        coolerData: {
          orderBy: { createdAt: "desc" }, // Mengurutkan CoolerData berdasarkan createdAt secara menurun
          take: 1, // Mengambil hanya entri pertama (terbaru)
        },
      },
    });

    // Memformat data untuk menyertakan latestData secara langsung
    const result = coolers.map((cooler) => ({
      id: cooler.id,
      name: cooler.name,
      createdAt: cooler.createdAt,
      updatedAt: cooler.updatedAt,
      latestData: cooler.coolerData[0] || null, // Mengambil entri pertama atau null jika tidak ada
    }));

    return result;
  } catch (error) {
    console.error("Error fetching coolers with latest data:", error);
    throw error;
  }
}

export default sendCoolerLatest;
