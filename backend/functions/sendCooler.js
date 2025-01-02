// sendCooler.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Mengambil semua Cooler beserta CoolerData terbaru untuk masing-masing Cooler.
 * Jika `searchKey` diberikan, hasil akan difilter berdasarkan keyword tersebut.
 * Jika tidak ada `searchKey`, akan menampilkan semua Cooler dengan data terbaru mereka.
 *
 * @param {String} [searchKey] - Kata kunci untuk mencari cooler.
 * @returns {Promise<Array>} Array of coolers dengan data terbaru mereka.
 * @throws {Error} Jika terjadi kesalahan saat pengambilan data.
 */
async function sendCooler(searchKey) {
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
              coolerData: {
                some: {
                  mode: {
                    equals: searchKey.toUpperCase(), // Enum biasanya uppercase
                  },
                },
              },
            },
            {
              coolerData: {
                some: {
                  speed: {
                    equals: isNaN(parseInt(searchKey)) ? undefined : parseInt(searchKey),
                  },
                },
              },
            },
            // Tambahkan kondisi lain jika diperlukan, misalnya berdasarkan tanggal
          ],
        }
      : {}; // Jika tidak ada searchKey, kondisi pencarian kosong (ambil semua)

    // Mengambil semua Cooler beserta CoolerData terbaru dengan kondisi pencarian
    const coolers = await prisma.cooler.findMany({
      where: whereCondition,
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

export default sendCooler;