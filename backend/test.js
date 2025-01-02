import { PrismaClient } from '@prisma/client';
import si from 'systeminformation';

const prisma = new PrismaClient();

async function getAndSaveSystemInfo() {
  try {
    // Fetch system information with proper `await` to ensure all values are fetched
    const cpu = await si.cpu();
    const cpuTemperature = await si.cpuTemperature();
    const mem = await si.mem();
    const disk = await si.diskLayout();
    const gpu = await si.graphics();
    const system = await si.system();
    const battery = await si.battery();
    const networkStats = await si.networkStats(); // Ensure we wait for network stats

    console.log(networkStats);

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
        networks: {
          create: networkStats.map((iface) => ({
            interface: iface.iface,
            rxSpeed: parseFloat((iface.rx_sec / 1024).toFixed(2)), // Convert to KB/s
            txSpeed: parseFloat((iface.tx_sec / 1024).toFixed(2)), // Convert to KB/s
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