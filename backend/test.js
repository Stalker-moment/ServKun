import { PrismaClient } from "@prisma/client";
import si from "systeminformation";

const prisma = new PrismaClient();

async function getAndSaveAllSystemInfo() {
  try {
    // Fetch all system information
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
      networkInterfaces,
      processes,
    ] = await Promise.all([
      si.system(),
      si.bios(),
      si.baseboard(),
      si.osInfo(),
      si.cpu(),
      si.cpuTemperature(),
      si.mem(),
      si.diskLayout(),
      si.fsSize(), // For disk usage/free
      si.graphics(), // For GPU usage and memory
      si.battery(),
      si.networkStats(),
      si.networkInterfaces(),
      si.processes(),
    ]);

    // Debugging: Log names from diskLayout and fsSize
    console.log(
      "Disks from diskLayout:",
      diskLayout.map((d) => d.name)
    );
    console.log(
      "File systems from fsSize:",
      fsSize.map((fs) => fs.fs)
    );

    // Save system info to the database
    const systemInfo = await prisma.systemInfo.create({
      data: {
        manufacturer: system.manufacturer,
        model: system.model,
        biosVendor: bios.vendor || null,
        biosVersion: bios.version || null,
        baseboardModel: baseboard.model || null,
        baseboardVendor: baseboard.manufacturer || null,
        osName: osInfo.distro,
        osArch: osInfo.arch,
        osRelease: osInfo.release,
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
          create: diskLayout.map((disk) => {
            // Find matching file system by name or heuristic
            const fs = fsSize.find(
              (fs) =>
                fs.fs.toLowerCase().includes(disk.name.toLowerCase()) ||
                disk.name.toLowerCase().includes(fs.fs.toLowerCase())
            );

            // Debugging: Log if no match is found
            if (!fs) {
              console.warn(`No matching file system for disk: ${disk.name}`);
            }

            return {
              name: disk.name,
              size: parseFloat((disk.size / 1e9).toFixed(2)),
              type: disk.type || null,
              used: fs ? parseFloat((fs.used / 1e9).toFixed(2)) : 0,
              free: fs
                ? parseFloat((fs.size / 1e9 - fs.used / 1e9).toFixed(2))
                : 0,
            };
          }),
        },
        gpus: {
          create: gpu.controllers.map((gpu) => ({
            vendor: gpu.vendor,
            model: gpu.model,
            temperature: gpu.temperatureGpu || null,
            usage: gpu.utilizationGpu || null, // GPU usage in percentage
            memory: gpu.memoryTotal
              ? parseFloat((gpu.memoryTotal / 1e9).toFixed(2))
              : null, // GPU memory in GB
          })),
        },
        networks: {
          create: networkStats.map((iface) => ({
            interface: iface.iface,
            macAddress: iface.mac || null,
            ipAddress: iface.ip4 || null,
            rxSpeed: parseFloat((iface.rx_sec / 1024).toFixed(2)), // Convert to KB/s
            txSpeed: parseFloat((iface.tx_sec / 1024).toFixed(2)), // Convert to KB/s
          })),
        },
        processes: {
          create: processes.list.map((proc) => ({
            name: proc.name,
            pid: proc.pid,
            memory: parseFloat((proc.mem / 1024).toFixed(2)) || 0, // Convert to MB
            cpuUsage: proc.cpu || 0, // Default to 0 if undefined
          })),
        },
      },
    });

    console.log("System information saved to database:", systemInfo);
  } catch (error) {
    console.error("Error fetching or saving system information:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getAndSaveAllSystemInfo();
