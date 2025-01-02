import { PrismaClient } from '@prisma/client';
import si from 'systeminformation';

const prisma = new PrismaClient();

async function getAndSaveSystemInfo() {
  try {
    // Fetch system information
    const [cpu, cpuTemperature, mem, disk, gpu, system, battery, networkStats] = await Promise.all([
      si.cpu(),
      si.cpuTemperature(),
      si.mem(),
      si.diskLayout(),
      si.graphics(),
      si.system(),
      si.battery(), // Battery information
      si.networkStats(), // Network statistics
    ]);

    // Calculate total network usage (sum of all interfaces)
    const totalNetworkUsage = networkStats.reduce((total, iface) => total + iface.rx_sec + iface.tx_sec, 0);

    // Save system info to the database
    const systemInfo = await prisma.systemInfo.create({
      data: {
        manufacturer: system.manufacturer,
        model: system.model,
        cpuBrand: cpu.brand,
        cpuManufacturer: cpu.manufacturer,
        cpuSpeed: parseFloat(cpu.speed),
        cpuCores: cpu.cores,
        cpuTemperature: cpuTemperature.main || null,
        totalRAM: parseFloat((mem.total / 1e9).toFixed(2)),
        usedRAM: parseFloat((mem.active / 1e9).toFixed(2)),
        batteryLevel: battery.percent || null,
        batteryVoltage: battery.voltage || null,
        isCharging: battery.isCharging,
        networkUsage: parseFloat((totalNetworkUsage / 1024).toFixed(2)), // Convert to KB/s
        disks: {
          create: disk.map((d) => ({
            name: d.name,
            size: parseFloat((d.size / 1e9).toFixed(2)),
          })),
        },
        gpus: {
          create: gpu.controllers.map((g) => ({
            vendor: g.vendor,
            model: g.model,
            temperature: g.temperatureGpu || null,
          })),
        },
      },
    });

    console.log('System information saved:', systemInfo);
  } catch (error) {
    console.error('Error fetching or saving system information:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAndSaveSystemInfo();