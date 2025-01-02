// sendSensor.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Mengambil semua Sensor (EnvTemp) beserta EnvTempData terbaru untuk masing-masing Sensor.
 * Jika `searchKey` diberikan, hasil akan difilter berdasarkan keyword tersebut.
 * Jika tidak ada `searchKey`, akan menampilkan semua Sensor dengan data terbaru mereka.
 *
 * @param {String} [searchKey] - Kata kunci untuk mencari sensor.
 * @returns {Promise<Array>} Array of sensors dengan data terbaru mereka.
 * @throws {Error} Jika terjadi kesalahan saat pengambilan data.
 */
async function sendSensor(searchKey) {
  try {
    // Menyiapkan kondisi pencarian berdasarkan adanya searchKey
    const whereCondition = searchKey
      ? {
          OR: [
            {
              name: {
                contains: searchKey,
                mode: 'insensitive', // Pencarian tidak case-sensitive
              },
            },
            {
              envTempData: {
                some: {
                  temperature: {
                    equals: isNaN(parseFloat(searchKey)) ? undefined : parseFloat(searchKey),
                  },
                },
              },
            },
            {
              envTempData: {
                some: {
                  humidity: {
                    equals: isNaN(parseFloat(searchKey)) ? undefined : parseFloat(searchKey),
                  },
                },
              },
            },
            // Tambahkan kondisi lain jika diperlukan, misalnya berdasarkan tanggal
          ],
        }
      : {}; // Jika tidak ada searchKey, kondisi pencarian kosong (ambil semua)

    // Mengambil semua EnvTemp beserta EnvTempData terbaru dengan kondisi pencarian
    const sensors = await prisma.envTemp.findMany({
      where: whereCondition,
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

export default sendSensor;