// sendSensorLatest.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Mengambil semua Sensor (EnvTemp) beserta EnvTempData terbaru untuk masing-masing Sensor.
 *
 * @returns {Promise<Array>} Array of sensors dengan data terbaru mereka.
 * @throws {Error} Jika terjadi kesalahan saat pengambilan data.
 */

async function sendSensorLatest() {
  try {
    // Mengambil semua EnvTemp beserta EnvTempData terbaru
    const sensors = await prisma.envTemp.findMany({
      include: {
        envTempData: {
          orderBy: { createdAt: "desc" }, // Mengurutkan EnvTempData berdasarkan createdAt secara menurun
          take: 1, // Mengambil hanya entri pertama (terbaru)
        },
      },
    });

    // Memformat data untuk menyertakan latestData secara langsung
    const result = sensors.map((sensor) => ({
      id: sensor.id,
      name: sensor.name,
      createdAt: sensor.createdAt,
      updatedAt: sensor.updatedAt,
      latestData: sensor.envTempData[0] || null, // Mengambil entri pertama atau null jika tidak ada
    }));

    return result;
  } catch (error) {
    console.error("Error fetching sensors with latest data:", error);
    throw error;
  }
}

export default sendSensorLatest;
