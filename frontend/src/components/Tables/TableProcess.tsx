"use client"; // Menandai komponen sebagai Client Component

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { FiEye } from "react-icons/fi";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrasi elemen Chart.js
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Definisikan tipe data yang diterima dari WebSocket
interface ProcessData {
  id: number;
  name: string;
  pid: number;
  memory: number; // Dalam MB
  cpuUsage: number; // Dalam persen
  systemInfoId: number;
  createdAt: string; // Akan ditampilkan sebagai dataRefresh
}

// Definisikan tipe data chart
interface ChartData {
  TimeChart: string[];
  CPUUsage: number[];
  Memory: number[];
}

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

const ProcessChart: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<string>(""); // Status WebSocket untuk debugging
  const [searchTerm, setSearchTerm] = useState<string>(""); // State untuk input pencarian
  const [keyword, setKeyword] = useState<string>(""); // State keyword untuk WebSocket

  // State untuk modal detail proses
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [processToDetail, setProcessToDetail] = useState<ProcessData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    // Membuat URL WebSocket dengan token dan keyword
    const token = Cookies.get("userAuth");
    if (!token) {
      setError("Token autentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    console.log("Token autentikasi:", token); // Logging token

    const wsUrl = `wss://${HTTPSAPIURL}/dataProcess?token=${token}&search=${encodeURIComponent(
      keyword
    )}`;
    console.log(`Menghubungkan ke WebSocket di URL: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    // Timer untuk timeout jika data tidak diterima dalam 30 detik
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError("Timeout: Tidak ada data yang diterima dari WebSocket.");
        setLoading(false);
        ws.close();
      }
    }, 30000); // 30 detik

    ws.onopen = () => {
      console.log("WebSocket connection opened.");
      setWsStatus("Terhubung");
      // Jika server memerlukan pesan inisialisasi atau langganan, kirim di sini
    };

    ws.onmessage = (event) => {
      console.log("Menerima data dari WebSocket:", event.data);
      try {
        const parsedData = JSON.parse(event.data);
        console.log("Data yang diparse:", parsedData);

        // Periksa apakah data adalah array
        if (Array.isArray(parsedData)) {
          setProcesses(parsedData as ProcessData[]);
          console.log("Data proses berhasil diperbarui:", parsedData);
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.processes && Array.isArray(parsedData.processes)) {
          // Jika data dibungkus dalam objek dengan properti 'processes'
          setProcesses(parsedData.processes as ProcessData[]);
          console.log(
            "Data proses berhasil diperbarui dari properti 'processes':",
            parsedData.processes
          );
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.error) {
          // Jika server mengirimkan pesan kesalahan
          console.error("Kesalahan dari server:", parsedData.error);
          setServerError(parsedData.error);
          setLoading(false);
          clearTimeout(timeoutId); // Kesalahan diterima, batalkan timeout
        } else {
          // Jika data bukan array atau tidak sesuai, log tapi tidak set error
          console.warn("Format data yang diterima tidak dikenali:", parsedData);
          setServerError("Format data yang diterima tidak dikenali.");
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        setError("Gagal memuat data.");
        setLoading(false);
        clearTimeout(timeoutId); // Kesalahan parsing, batalkan timeout
      }
    };

    // ws.onerror = (event) => {
    //   console.error("WebSocket error:", event);
    //   setError("Terjadi kesalahan pada koneksi WebSocket.");
    //   setLoading(false);
    //   ws.close();
    // };

    // ws.onclose = (event) => {
    //   console.log("WebSocket connection closed:", event.reason);
    //   setWsStatus("Terputus");
    // };

    // Cleanup saat komponen unmount atau keyword berubah
    return () => {
      console.log("Menutup koneksi WebSocket.");
      ws.close();
      clearTimeout(timeoutId); // Bersihkan timeout saat unmount
    };
  }, [keyword]); // Hapus 'loading' dari dependency array

  // Handler untuk perubahan input pencarian
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk submit form pencarian
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setServerError(null);
    setKeyword(searchTerm); // Update keyword untuk trigger WebSocket
  };

  // Handler untuk membuka modal detail proses
  const openDetailModal = (process: ProcessData) => {
    setProcessToDetail(process);
    setIsDetailModalOpen(true);
    fetchChartData(process.name);
  };

  // Handler untuk menutup modal detail proses
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setProcessToDetail(null);
    setChartData(null);
    setChartError(null);
  };

  // Fungsi untuk mengambil data chart melalui WebSocket
  const fetchChartData = (processName: string) => {
    const token = Cookies.get("userAuth");
    if (!token) {
      setChartError("Token autentikasi tidak ditemukan.");
      return;
    }

    setChartLoading(true);
    setChartError(null);

    const chartWsUrl = `wss://${HTTPSAPIURL}/ChartProcess?token=${token}&name=${encodeURIComponent(processName)}`;
    console.log(`Menghubungkan ke WebSocket Chart di URL: ${chartWsUrl}`);
    const chartWs = new WebSocket(chartWsUrl);

    // Timer untuk timeout jika data tidak diterima dalam 30 detik
    const chartTimeoutId = setTimeout(() => {
      if (chartLoading) {
        setChartError("Timeout: Tidak ada data yang diterima dari WebSocket Chart.");
        setChartLoading(false);
        chartWs.close();
      }
    }, 30000); // 30 detik

    chartWs.onopen = () => {
      console.log("WebSocket Chart connection opened.");
      // Jika server memerlukan pesan inisialisasi atau langganan, kirim di sini
    };

    chartWs.onmessage = (event) => {
      console.log("Menerima data dari WebSocket Chart:", event.data);
      try {
        const parsedChartData = JSON.parse(event.data) as ChartData;
        console.log("Data chart yang diparse:", parsedChartData);
        setChartData(parsedChartData);
        setChartLoading(false);
        clearTimeout(chartTimeoutId); // Data diterima, batalkan timeout
        chartWs.close(); // Tutup WebSocket setelah menerima data
      } catch (err) {
        console.error("Error parsing WebSocket Chart message:", err);
        setChartError("Gagal memuat data chart.");
        setChartLoading(false);
        clearTimeout(chartTimeoutId); // Kesalahan parsing, batalkan timeout
        chartWs.close();
      }
    };

    // chartWs.onerror = (event) => {
    //   console.error("WebSocket Chart error:", event);
    //   setChartError("Terjadi kesalahan pada koneksi WebSocket Chart.");
    //   setChartLoading(false);
    //   chartWs.close();
    // };

    // chartWs.onclose = (event) => {
    //   console.log("WebSocket Chart connection closed:", event.reason);
    // };
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {/* Header: Jumlah Proses dan Search Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-2 sm:mb-0">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {keyword
              ? `Ditemukan ${processes.length} proses untuk "${keyword}"`
              : `Total Proses: ${processes.length}`}
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex flex-1 sm:ml-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Cari proses berdasarkan nama atau PID..."
            className="flex-1 rounded-l-md border border-stroke px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="hover:bg-primary-dark rounded-r-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Modal Detail Proses */}
      {isDetailModalOpen && processToDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDetailModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Detail Proses
            </h2>
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Nama Proses:</strong> {processToDetail.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>PID:</strong> {processToDetail.pid}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Memory:</strong> {processToDetail.memory} MB
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>CPU Usage:</strong> {processToDetail.cpuUsage.toFixed(2)}%
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Data Refresh:</strong>{" "}
                {new Date(processToDetail.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Bagian Chart */}
            <div className="mb-6">
              <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                Grafik Penggunaan CPU dan Memori
              </h3>
              {chartLoading && (
                <div className="flex items-center justify-center p-4">
                  <p className="text-gray-500 dark:text-gray-300">Memuat grafik...</p>
                </div>
              )}
              {chartError && (
                <div className="flex items-center justify-center p-4">
                  <p className="text-red-500">{chartError}</p>
                </div>
              )}
              {chartData && (
                <Line
                  data={{
                    labels: chartData.TimeChart,
                    datasets: [
                      {
                        label: 'CPU Usage (%)',
                        data: chartData.CPUUsage,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                      },
                      {
                        label: 'Memory (MB)',
                        data: chartData.Memory,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      tooltip: {
                        mode: 'index' as const,
                        intersect: false,
                      },
                    },
                    interaction: {
                      mode: 'nearest' as const,
                      axis: 'x' as const,
                      intersect: false,
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Waktu',
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Penggunaan (%) / (MB)',
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={closeDetailModal}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kondisi Loading */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <p className="text-gray-500 dark:text-gray-300">Memuat data...</p>
        </div>
      )}

      {/* Kondisi Error */}
      {!loading && (error || serverError) && (
        <div className="flex flex-col items-center justify-center p-4">
          <p className="mb-2 text-red-500">{error || serverError}</p>
          <p className="text-gray-500 dark:text-gray-300">
            Status WebSocket: {wsStatus}
          </p>
        </div>
      )}

      {/* Tabel Proses dengan Header Sticky */}
      {!loading && !error && !serverError && (
        <div className="max-w-full overflow-x-auto">
          {/* Membungkus tabel dalam div dengan max-height dan overflow-y-auto */}
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                  {/* Hapus kolom ID */}
                  <th className="min-w-[200px] px-4 py-4 font-medium text-dark dark:text-white sticky top-0 bg-[#F7F9FC] dark:bg-dark-2 z-10">
                    Nama Proses
                  </th>
                  <th className="min-w-[100px] px-4 py-4 font-medium text-dark dark:text-white sticky top-0 bg-[#F7F9FC] dark:bg-dark-2 z-10">
                    PID
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white sticky top-0 bg-[#F7F9FC] dark:bg-dark-2 z-10">
                    Memory (MB)
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white sticky top-0 bg-[#F7F9FC] dark:bg-dark-2 z-10">
                    CPU Usage (%)
                  </th>
                  <th className="px-4 py-4 text-right font-medium text-dark dark:text-white sticky top-0 bg-[#F7F9FC] dark:bg-dark-2 z-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.id}>
                    {/* Nama Proses */}
                    <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                      <p className="text-dark dark:text-white">{process.name}</p>
                    </td>
                    {/* PID */}
                    <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                      <p className="text-dark dark:text-white">{process.pid}</p>
                    </td>
                    {/* Memory */}
                    <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                      <p className="text-dark dark:text-white">{process.memory}</p>
                    </td>
                    {/* CPU Usage */}
                    <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                      <p className="text-dark dark:text-white">
                        {process.cpuUsage.toFixed(2)}%
                      </p>
                    </td>
                    {/* Actions */}
                    <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 text-right">
                      <button
                        onClick={() => openDetailModal(process)}
                        className="hover:text-primary"
                        title="Lihat Detail"
                      >
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}
                {processes.length === 0 && (
                  <tr>
                    <td
                      colSpan={5} // Ubah dari 6 menjadi 5
                      className="border-b border-[#eee] px-4 py-4 text-center dark:border-dark-3"
                    >
                      <p className="text-gray-500 dark:text-gray-300">
                        Tidak ada data yang ditemukan.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessChart;