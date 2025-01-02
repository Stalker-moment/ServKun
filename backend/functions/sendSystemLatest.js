import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function sendSystemLatest() {
    try {
        // Fetch the latest system information
        const latestSystemInfo = await prisma.systemInfo.findFirst({
            orderBy: {
                createdAt: "desc", // Sort by creation date, latest first
            },
            include: {
                disks: true,       // Include related disks
                gpus: true,        // Include related GPUs
                networks: true,    // Include related networks
            },
        });

        // If no system info is found
        if (!latestSystemInfo) {
            console.log("No system information available.");
            return null;
        }

        // Count the number of related processes
        const processCount = await prisma.process.count({
            where: {
                systemInfoId: latestSystemInfo.id, // Count processes for the latest system info
            },
        });

        // Add the process count to the result
        const result = {
            ...latestSystemInfo,
            processCount,
        };

        // Return the updated system info with process count
        //console.log("Latest system information with process count:", result);
        return result;
    } catch (error) {
        console.error("Error fetching systems:", error);
        throw error;
    }
}

export default sendSystemLatest;