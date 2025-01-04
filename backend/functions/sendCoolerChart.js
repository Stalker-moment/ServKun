import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

/**
 * Fetch logs filtered by today's date and CoolerId, and format them into a specific structure.
 * @param {number} coolerId - The ID of the cooler to filter logs by.
 * @returns {Promise<Object>} - A promise that resolves to an object with TimeChart, Speed, and Mode arrays.
 */

async function sendCoolerChart(coolerId) {
    try {
        // Get the start and end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch the data for today from CoolerData
        const coolerDataLogs = await prisma.coolerData.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                coolerId: coolerId, // Filter by coolerId
            },
            orderBy: {
                createdAt: 'asc', // Order by timestamp (createdAt)
            },
        });

        // Process the data
        const data = {
            TimeChart: [],
            Speed: [],
            Mode: [],
        };

        coolerDataLogs.forEach(log => {
            data.TimeChart.push(format(log.createdAt, 'HH:mm:ss')); // Format timestamp
            data.Speed.push(log.speed); // Store speed
            data.Mode.push(log.mode); // Store mode
        });

        // Filtering data (only 15 latest data)
        if (data.TimeChart.length > 15) {
            data.TimeChart = data.TimeChart.slice(data.TimeChart.length - 15);
            data.Speed = data.Speed.slice(data.Speed.length - 15);
            data.Mode = data.Mode.slice(data.Mode.length - 15);
        }

        return data;

    } catch (error) {
        console.error("Error fetching cooler chart:", error);
        throw error;
    }
}

export default sendCoolerChart;