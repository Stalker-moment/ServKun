// components/SystemInfo.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import styles from "./SystemInfo.module.css";
import { 
  FaDesktop, 
  FaMemory, 
  FaBatteryFull, 
  FaHdd, 
  FaMicrochip, 
  FaNetworkWired, 
  FaCogs, 
  FaServer,
  FaWifi,
} from "react-icons/fa";
import { FiCpu } from "react-icons/fi";
import { IconContext } from "react-icons";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import useIsDarkMode from "@/hooks/UseIsDarkMode";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Disk {
  id: number;
  name: string;
  size: number; // in GB
  type: string;
  used: number;
  free: number;
  systemInfoId: number;
}

interface GPU {
  id: number;
  vendor: string;
  model: string;
  temperature: number | null;
  usage: number | null;
  memory: number | null;
  systemInfoId: number;
}

interface Network {
  id: number;
  interface: string;
  macAddress: string | null;
  ipAddress: string | null;
  rxSpeed: number;
  txSpeed: number;
  systemInfoId: number;
}

interface SystemInfoData {
  id: number;
  manufacturer: string;
  model: string;
  biosVendor: string;
  biosVersion: string;
  baseboardModel: string;
  baseboardVendor: string;
  osName: string;
  osArch: string;
  osRelease: string;
  cpuBrand: string;
  cpuManufacturer: string;
  cpuSpeed: number; // in GHz
  cpuCores: number;
  cpuTemperature: number | null;
  totalRAM: number; // in GB
  usedRAM: number; // in GB
  batteryLevel: number; // in percentage
  batteryVoltage: number; // in volts
  isCharging: boolean;
  createdAt: string;
  disks?: Disk[];
  gpus?: GPU[];
  networks?: Network[];
  processCount: number;
}

interface MemoryChartData {
  TimeChart: string[];
  TotalRAM: number[];
  UsedRAM: number[];
  AvailableRAM: number[];
}

const SystemInfo: React.FC = () => {
  const isDarkMode = useIsDarkMode(); // Menggunakan hook untuk mendeteksi tema
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [userAuth, setUserAuth] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State untuk Modal dan Chart
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [memoryChartData, setMemoryChartData] = useState<MemoryChartData>({
    TimeChart: [],
    TotalRAM: [],
    UsedRAM: [],
    AvailableRAM: [],
  });
  const memoryWsRef = useRef<WebSocket | null>(null);
  const memoryReconnectAttemptsRef = useRef<number>(0);
  const memoryReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi untuk menghubungkan WebSocket dengan mekanisme auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (!userAuth) return;

    const wsUrl = `wss://${process.env.NEXT_PUBLIC_HTTPS_API_URL}/dataSystemLatest?token=${userAuth}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      reconnectAttemptsRef.current = 0; // Reset rekoneksi saat berhasil terhubung
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: SystemInfoData = JSON.parse(event.data);
        console.log("System info received:", data); // Tambahkan log ini
        setSystemInfo(data);
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    // ws.onerror = (error: Event) => {
    //   console.error("WebSocket error:", error);
    //   // WebSocket akan ditutup dan reconnect akan dilakukan di onclose
    // };

    // ws.onclose = (event: CloseEvent) => {
    //   console.log("WebSocket connection closed:", event);
    //   // Auto-reconnect dengan delay eksponensial hingga maksimal 30 detik
    //   const timeout = Math.min(30000, 1000 * 2 ** reconnectAttemptsRef.current); // Max 30 detik
    //   console.log(`Attempting to reconnect in ${timeout / 1000} seconds...`);
    //   reconnectTimeoutRef.current = setTimeout(() => {
    //     reconnectAttemptsRef.current += 1;
    //     connectWebSocket();
    //   }, timeout);
    // };
  }, [userAuth]);

  // Fungsi untuk menghubungkan WebSocket Chart Memory
  const connectMemoryWebSocket = useCallback(() => {
    if (!userAuth) return;

    const wsUrl = `wss://${process.env.NEXT_PUBLIC_HTTPS_API_URL}/ChartMemory?token=${userAuth}`;
    const ws = new WebSocket(wsUrl);
    memoryWsRef.current = ws;

    ws.onopen = () => {
      console.log("Memory WebSocket connection established.");
      memoryReconnectAttemptsRef.current = 0; // Reset rekoneksi saat berhasil terhubung
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: MemoryChartData = JSON.parse(event.data);
        console.log("Memory chart data received:", data); // Tambahkan log ini
        setMemoryChartData(data);
      } catch (error) {
        console.error("Error parsing Memory WebSocket data:", error);
      }
    };

    // ws.onerror = (error: Event) => {
    //   console.error("Memory WebSocket error:", error);
    //   // WebSocket akan ditutup dan reconnect akan dilakukan di onclose
    // };

    // ws.onclose = (event: CloseEvent) => {
    //   console.log("Memory WebSocket connection closed:", event);
    //   // Auto-reconnect dengan delay eksponensial hingga maksimal 30 detik
    //   const timeout = Math.min(30000, 1000 * 2 ** memoryReconnectAttemptsRef.current); // Max 30 detik
    //   console.log(`Attempting to reconnect Memory WebSocket in ${timeout / 1000} seconds...`);
    //   memoryReconnectTimeoutRef.current = setTimeout(() => {
    //     memoryReconnectAttemptsRef.current += 1;
    //     connectMemoryWebSocket();
    //   }, timeout);
    // };
  }, [userAuth]);

  // Ambil userAuth dari cookie saat komponen dimuat
  useEffect(() => {
    const auth = Cookies.get("userAuth");
    if (!auth) {
      console.error("userAuth token tidak ditemukan di cookies.");
      return;
    }
    setUserAuth(auth);
  }, []);

  // Koneksikan WebSocket saat userAuth diperbarui
  useEffect(() => {
    if (userAuth) {
      connectWebSocket();
    }
    // Cleanup saat komponen di-unmount atau userAuth berubah
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Cleanup Memory WebSocket jika ada
      if (memoryWsRef.current) {
        memoryWsRef.current.close();
      }
      if (memoryReconnectTimeoutRef.current) {
        clearTimeout(memoryReconnectTimeoutRef.current);
      }
    };
  }, [userAuth, connectWebSocket, connectMemoryWebSocket]);

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", { hour12: false });
  };

  // Fungsi untuk menghitung persentase penggunaan RAM
  const getRamUsage = () => {
    if (!systemInfo) return 0;
    return Math.round((systemInfo.usedRAM / systemInfo.totalRAM) * 100);
  };

  // Fungsi untuk menghitung suhu CPU (misalnya)
  const getCpuTemperature = () => {
    if (systemInfo && systemInfo.cpuTemperature !== null) {
      return systemInfo.cpuTemperature;
    }
    return "N/A";
  };

  // Fungsi untuk membuka modal dan menghubungkan WebSocket Memory
  const openModal = () => {
    setIsModalOpen(true);
    connectMemoryWebSocket();
  };

  // Fungsi untuk menutup modal dan memutuskan WebSocket Memory
  const closeModal = () => {
    setIsModalOpen(false);
    if (memoryWsRef.current) {
      memoryWsRef.current.close();
    }
    if (memoryReconnectTimeoutRef.current) {
      clearTimeout(memoryReconnectTimeoutRef.current);
    }
    // Reset chart data jika diperlukan
    setMemoryChartData({
      TimeChart: [],
      TotalRAM: [],
      UsedRAM: [],
      AvailableRAM: [],
    });
  };

  // Data dan opsi untuk Chart.js
  const chartData = {
    labels: memoryChartData.TimeChart,
    datasets: [
      {
        label: 'Total RAM (GB)',
        data: memoryChartData.TotalRAM,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Warna untuk Total RAM
      },
      {
        label: 'Used RAM (GB)',
        data: memoryChartData.UsedRAM,
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Warna untuk Used RAM
      },
      {
        label: 'Available RAM (GB)',
        data: memoryChartData.AvailableRAM,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Warna untuk Available RAM
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000', // Sesuaikan warna legenda
        },
      },
      title: {
        display: true,
        text: 'Memory Usage Chart',
        color: isDarkMode ? '#ffffff' : '#000000', // Sesuaikan warna judul
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} GB`;
          }
        },
        titleColor: isDarkMode ? '#ffffff' : '#000000',
        bodyColor: isDarkMode ? '#ffffff' : '#000000',
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000', // Sesuaikan warna label sumbu x
        },
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Sesuaikan warna grid sumbu x
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000', // Sesuaikan warna label sumbu y
        },
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Sesuaikan warna grid sumbu y
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <IconContext.Provider value={{ size: "1.5em", className: styles.icon }}>
      <div className={styles.container}>
        {systemInfo ? (
          <>
            <h1 className={styles.title}>System Information</h1>
            <div className={styles.gridContainer}>
              {/* Basic Information */}
              <div className={`${styles.card} ${styles.basicInfo}`}>
                <FaDesktop className={styles.cardIcon} />
                <h2>Basic Information</h2>
                <div className={styles.info}>
                  <div>
                    <strong>Manufacturer:</strong> {systemInfo.manufacturer}
                  </div>
                  <div>
                    <strong>Model:</strong> {systemInfo.model}
                  </div>
                  <div>
                    <strong>Bios:</strong> {systemInfo.biosVendor} {systemInfo.biosVersion}
                  </div>
                  <div>
                    <strong>Baseboard:</strong> {systemInfo.baseboardVendor} {systemInfo.baseboardModel}
                  </div>
                  <div>
                    <strong>OS:</strong> {systemInfo.osName} {systemInfo.osRelease} ({systemInfo.osArch})
                  </div>
                  <div>
                    <strong>Data Refresh:</strong> {formatDate(systemInfo.createdAt)}
                  </div>
                </div>
              </div>

              {/* CPU Information */}
              <div className={`${styles.card} ${styles.cpuInfo}`}>
                <FiCpu className={styles.cardIcon} />
                <h2>CPU</h2>
                <div className={styles.info}>
                  <div>
                    <strong>Brand:</strong> {systemInfo.cpuBrand}
                  </div>
                  <div>
                    <strong>Manufacturer:</strong> {systemInfo.cpuManufacturer}
                  </div>
                  <div>
                    <strong>Speed:</strong> {systemInfo.cpuSpeed} GHz
                  </div>
                  <div>
                    <strong>Cores:</strong> {systemInfo.cpuCores}
                  </div>
                  <div>
                    <strong>Temperature:</strong> {getCpuTemperature()}°C
                  </div>
                </div>
              </div>

              {/* Memory Information */}
              <div className={`${styles.card} ${styles.memoryInfo}`} onClick={openModal} style={{ cursor: 'pointer' }}>
                <FaMemory className={styles.cardIcon} />
                <h2>Memory</h2>
                <div className={styles.info}>
                  <div className={styles.progressContainer}>
                    <span>Used RAM: {systemInfo.usedRAM} GB / {systemInfo.totalRAM} GB</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${getRamUsage()}%`, backgroundColor: isDarkMode ? '#4caf50' : '#4caf50' }} // Bisa disesuaikan lebih lanjut
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Battery Information */}
              <div className={`${styles.card} ${styles.batteryInfo}`}>
                <FaBatteryFull className={styles.cardIcon} />
                <h2>Battery</h2>
                <div className={styles.info}>
                  <div className={styles.progressContainer}>
                    <span>Battery Level: {systemInfo.batteryLevel}%</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${systemInfo.batteryLevel}%`, 
                          backgroundColor: systemInfo.batteryLevel > 20 ? '#4caf50' : '#f44336' 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <strong>Voltage:</strong> {systemInfo.batteryVoltage} V
                  </div>
                  <div>
                    <strong>Charging:</strong> {systemInfo.isCharging ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {/* Storage Information */}
              <div className={`${styles.card} ${styles.storageInfo}`}>
                <FaHdd className={styles.cardIcon} />
                <h2>Storage</h2>
                <div className={styles.info}>
                  {systemInfo.disks && Array.isArray(systemInfo.disks) ? (
                    systemInfo.disks.map((disk) => (
                      <div key={disk.id} className={styles.subSection}>
                        <strong>{disk.name}</strong>
                        <div>Type: {disk.type}</div>
                        <div>Size: {disk.size} GB</div>
                        <div>Used: {disk.used} GB</div>
                        <div>Free: {disk.free} GB</div>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.subSection} ${styles.noData}`}>
                      Disk information is not available.
                    </div>
                  )}
                </div>
              </div>

              {/* GPU Information */}
              <div className={`${styles.card} ${styles.gpuInfo}`}>
                <FaMicrochip className={styles.cardIcon} />
                <h2>GPU</h2>
                <div className={styles.info}>
                  {systemInfo.gpus && Array.isArray(systemInfo.gpus) ? (
                    systemInfo.gpus.map((gpu) => (
                      <div key={gpu.id} className={styles.subSection}>
                        <strong>{gpu.vendor} {gpu.model}</strong>
                        <div>Temperature: {gpu.temperature !== null ? `${gpu.temperature}°C` : "N/A"}</div>
                        <div>Usage: {gpu.usage !== null ? `${gpu.usage}%` : "N/A"}</div>
                        <div>Memory: {gpu.memory !== null ? `${gpu.memory} GB` : "N/A"}</div>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.subSection} ${styles.noData}`}>
                      GPU information is not available.
                    </div>
                  )}
                </div>
              </div>

              {/* Network Information */}
              <div className={`${styles.card} ${styles.networkInfo}`}>
                <FaWifi className={styles.cardIcon} />
                <h2>Network</h2>
                <div className={styles.info}>
                  {systemInfo.networks && Array.isArray(systemInfo.networks) ? (
                    systemInfo.networks.map((network) => (
                      <div key={network.id} className={styles.subSection}>
                        <strong>{network.interface}</strong>
                        <div>MAC Address: {network.macAddress || "N/A"}</div>
                        <div>IP Address: {network.ipAddress || "N/A"}</div>
                        <div>RX Speed: {network.rxSpeed} Kbps</div>
                        <div>TX Speed: {network.txSpeed} Kbps</div>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.subSection} ${styles.noData}`}>
                      Network information is not available.
                    </div>
                  )}
                </div>
              </div>

              {/* Processes Information */}
              <div className={`${styles.card} ${styles.processInfo}`}>
                <FaCogs className={styles.cardIcon} />
                <h2>Processes</h2>
                <div className={styles.info}>
                  <div>
                    <strong>Process Count:</strong> {systemInfo.processCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal untuk Memory Chart */}
            {isModalOpen && (
              <div className={styles.modalOverlay} onClick={closeModal}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.closeButton} onClick={closeModal}>&times;</button>
                  <h2>Memory Usage Chart</h2>
                  {memoryChartData.TimeChart.length > 0 ? (
                    <Bar data={chartData} options={chartOptions} />
                  ) : (
                    <p>Loading chart data...</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.loading}>
            <FaServer className={styles.spinner} />
            <span>Loading system information...</span>
          </div>
        )}
      </div>
    </IconContext.Provider>
  );
};

export default SystemInfo;
