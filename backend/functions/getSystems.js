import { PrismaClient } from '@prisma/client';
import si from 'systeminformation';

const prisma = new PrismaClient();

async function getAndSaveAllSystemInfo() {
  try {
    // Fetch all system information with proper error handling
    const [
      system,
      bios,
      baseboard,
      osInfo,
      cpu,
      cpuTemperature,
      mem,
      diskLayout,
      fsSize,
      gpu,
      battery,
      networkStats,
      processes,
    ] = await Promise.all([
      si.system().catch((err) => {
        console.error('Error fetching system info:', err);
        return {};
      }),
      si.bios().catch((err) => {
        console.error('Error fetching BIOS info:', err);
        return {};
      }),
      si.baseboard().catch((err) => {
        console.error('Error fetching baseboard info:', err);
        return {};
      }),
      si.osInfo().catch((err) => {
        console.error('Error fetching OS info:', err);
        return {};
      }),
      si.cpu().catch((err) => {
        console.error('Error fetching CPU info:', err);
        return {};
      }),
      si.cpuTemperature().catch((err) => {
        console.error('Error fetching CPU temperature:', err);
        return { main: null };
      }),
      si.mem().catch((err) => {
        console.error('Error fetching memory info:', err);
        return { total: 0, active: 0 };
      }),
      si.diskLayout().catch((err) => {
        console.error('Error fetching disk layout:', err);
        return [];
      }),
      si.fsSize().catch((err) => {
        console.error('Error fetching file system info:', err);
        return [];
      }),
      si.graphics().catch((err) => {
        console.error('Error fetching GPU info:', err);
        return { controllers: [] };
      }),
      si.battery().catch((err) => {
        console.error('Error fetching battery info:', err);
        return { percent: null, voltage: null, isCharging: null };
      }),
      si.networkStats().catch((err) => {
        console.error('Error fetching network stats:', err);
        return [];
      }),
      si.processes().catch((err) => {
        console.error('Error fetching processes info:', err);
        return { list: [] };
      }),
    ]);

    // Prepare and save system info to the database
    const systemInfo = await prisma.systemInfo.create({
      data: {
        manufacturer: system.manufacturer || 'Unknown',
        model: system.model || 'Unknown',
        biosVendor: bios.vendor || null,
        biosVersion: bios.version || null,
        baseboardModel: baseboard.model || null,
        baseboardVendor: baseboard.manufacturer || null,
        osName: osInfo.distro || 'Unknown',
        osArch: osInfo.arch || 'Unknown',
        osRelease: osInfo.release || 'Unknown',
        cpuBrand: cpu.brand || 'Unknown',
        cpuManufacturer: cpu.manufacturer || 'Unknown',
        cpuSpeed: parseFloat(cpu.speed || 0),
        cpuCores: cpu.cores || 0,
        cpuTemperature: cpuTemperature.main || null,
        totalRAM: parseFloat((mem.total / 1e9).toFixed(2)) || 0,
        usedRAM: parseFloat((mem.active / 1e9).toFixed(2)) || 0,
        batteryLevel: battery.percent || null,
        batteryVoltage: battery.voltage || null,
        isCharging: battery.isCharging || false,
        disks: {
          create: diskLayout.map((disk) => {
            const fs = fsSize.find((fs) =>
              fs.fs.toLowerCase().includes(disk.name.toLowerCase()),
            );

            return {
              name: disk.name || 'Unknown',
              size: parseFloat((disk.size / 1e9).toFixed(2)) || 0,
              type: disk.type || null,
              used: fs ? parseFloat((fs.used / 1e9).toFixed(2)) : 0,
              free: fs ? parseFloat((fs.size / 1e9 - fs.used / 1e9).toFixed(2)) : 0,
            };
          }),
        },
        gpus: {
          create: gpu.controllers.map((gpu) => ({
            vendor: gpu.vendor || 'Unknown',
            model: gpu.model || 'Unknown',
            temperature: gpu.temperatureGpu || null,
            usage: gpu.utilizationGpu || null,
            memory: gpu.memoryTotal
              ? parseFloat((gpu.memoryTotal / 1e9).toFixed(2))
              : null,
          })),
        },
        networks: {
          create: networkStats.map((iface) => ({
            interface: iface.iface || 'Unknown',
            macAddress: iface.mac || null,
            ipAddress: iface.ip4 || null,
            rxSpeed: parseFloat((iface.rx_sec / 1024).toFixed(2)) || 0,
            txSpeed: parseFloat((iface.tx_sec / 1024).toFixed(2)) || 0,
          })),
        },
        processes: {
          create: processes.list.map((proc) => ({
            name: proc.name || 'Unknown',
            pid: proc.pid || 0,
            memory: parseFloat((proc.mem / 1024).toFixed(2)) || 0,
            cpuUsage: proc.cpu || 0,
          })),
        },
      },
    });

    //console.log('System information saved to database:', systemInfo);
  } catch (error) {
    console.error('Error fetching or saving system information:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default getAndSaveAllSystemInfo;