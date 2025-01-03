// pages/monitor.tsx
"use client"; // Menandai komponen sebagai Client Component

import React, { useEffect, useState, ChangeEvent } from "react";
import Cookies from "js-cookie";
import { FiCopy } from "react-icons/fi";
import { BsFillGearFill } from "react-icons/bs";
import CoolerAnimation from "./CoolerAnimation";
import useDebounce from "@/hooks/useDebounce";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

// Definisikan tipe data yang diterima dari WebSocket
interface SensorData {
  id: number;
  envTempId: number;
  temperature: number;
  humidity: number;
  createdAt: string;
}

interface Sensor {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  latestData: SensorData | null;
}

interface CoolerData {
  id: number;
  coolerId: number;
  mode: "DEFAULT" | "ATEMP" | "ACLOCK" | "MANUAL";
  speed: number;
  createdAt: string;
}

interface Cooler {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  latestData: CoolerData | null;
}

const Monitor: React.FC = () => {
  // State untuk Sensor
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorLoading, setSensorLoading] = useState<boolean>(true);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [sensorWsStatus, setSensorWsStatus] = useState<string>("");

  // State untuk Cooler
  const [coolers, setCoolers] = useState<Cooler[]>([]);
  const [coolerLoading, setCoolerLoading] = useState<boolean>(true);
  const [coolerError, setCoolerError] = useState<string | null>(null);
  const [coolerWsStatus, setCoolerWsStatus] = useState<string>("");

  // State untuk Pencarian (Opsional)
  const [sensorSearchTerm, setSensorSearchTerm] = useState<string>("");
  const [coolerSearchTerm, setCoolerSearchTerm] = useState<string>("");

  // State untuk Modal Salin ID
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [copyItem, setCopyItem] = useState<{ type: "Sensor" | "Cooler"; id: number } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // State untuk Mengubah Mode Cooler
  const [isChangeModeModalOpen, setIsChangeModeModalOpen] = useState<boolean>(false);
  const [coolerToChangeMode, setCoolerToChangeMode] = useState<Cooler | null>(null);
  const [changeMode, setChangeMode] = useState<{ coolerId: number; mode: string }>({
    coolerId: 0,
    mode: "DEFAULT",
  });
  const modeOptions = ["DEFAULT", "ATEMP", "ACLOCK", "MANUAL"] as const;

  // State untuk Mengubah Speed Cooler
  const [isChangeSpeedModalOpen, setIsChangeSpeedModalOpen] = useState<boolean>(false);
  const [coolerToChangeSpeed, setCoolerToChangeSpeed] = useState<Cooler | null>(null);
  const [changeSpeed, setChangeSpeed] = useState<{ coolerId: number; speed: number }>({
    coolerId: 0,
    speed: 0,
  });

  // State untuk Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Token Autentikasi
  const token = Cookies.get("userAuth");

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
    setIsDarkMode(!isDarkMode);
  };

  // Koneksi WebSocket untuk Sensor
  useEffect(() => {
    if (!token) {
      setSensorError("Token autentikasi tidak ditemukan.");
      setSensorLoading(false);
      return;
    }

    const wsUrl = `wss://${HTTPSAPIURL}/dataSensorLatest?token=${token}`;
    console.log(`Menghubungkan ke WebSocket Sensor di URL: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    // Timeout jika tidak ada data dalam 30 detik
    const timeoutId = setTimeout(() => {
      if (sensorLoading) {
        setSensorError("Timeout: Tidak ada data yang diterima dari WebSocket Sensor.");
        setSensorLoading(false);
        ws.close();
      }
    }, 30000); // 30 detik

    ws.onopen = () => {
      console.log("WebSocket Sensor Terhubung.");
      setSensorWsStatus("Terhubung");
    };

    ws.onmessage = (event) => {
      console.log("Menerima data dari WebSocket Sensor:", event.data);
      try {
        const parsedData: Sensor[] = JSON.parse(event.data);
        setSensors(parsedData);
        setSensorLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Error parsing WebSocket Sensor message:", err);
        setSensorError("Gagal memuat data Sensor.");
        setSensorLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // ws.onerror = (event) => {
    //   console.error("WebSocket Sensor Error:", event);
    //   setSensorError("Terjadi kesalahan pada koneksi WebSocket Sensor.");
    //   setSensorLoading(false);
    //   ws.close();
    // };

    // ws.onclose = (event) => {
    //   console.log("WebSocket Sensor Ditutup:", event.reason);
    //   setSensorWsStatus("Terputus");
    // };

    return () => {
      console.log("Menutup koneksi WebSocket Sensor.");
      ws.close();
      clearTimeout(timeoutId);
    };
  }, [token, HTTPSAPIURL, sensorLoading]);

  // Koneksi WebSocket untuk Cooler
  useEffect(() => {
    if (!token) {
      setCoolerError("Token autentikasi tidak ditemukan.");
      setCoolerLoading(false);
      return;
    }

    const wsUrl = `wss://${HTTPSAPIURL}/dataCoolerLatest?token=${token}`;
    console.log(`Menghubungkan ke WebSocket Cooler di URL: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    // Timeout jika tidak ada data dalam 30 detik
    const timeoutId = setTimeout(() => {
      if (coolerLoading) {
        setCoolerError("Timeout: Tidak ada data yang diterima dari WebSocket Cooler.");
        setCoolerLoading(false);
        ws.close();
      }
    }, 30000); // 30 detik

    ws.onopen = () => {
      console.log("WebSocket Cooler Terhubung.");
      setCoolerWsStatus("Terhubung");
    };

    ws.onmessage = (event) => {
      console.log("Menerima data dari WebSocket Cooler:", event.data);
      try {
        const parsedData: Cooler[] = JSON.parse(event.data);
        setCoolers(parsedData);
        setCoolerLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Error parsing WebSocket Cooler message:", err);
        setCoolerError("Gagal memuat data Cooler.");
        setCoolerLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // ws.onerror = (event) => {
    //   console.error("WebSocket Cooler Error:", event);
    //   setCoolerError("Terjadi kesalahan pada koneksi WebSocket Cooler.");
    //   setCoolerLoading(false);
    //   ws.close();
    // };

    // ws.onclose = (event) => {
    //   console.log("WebSocket Cooler Ditutup:", event.reason);
    //   setCoolerWsStatus("Terputus");
    // };

    return () => {
      console.log("Menutup koneksi WebSocket Cooler.");
      ws.close();
      clearTimeout(timeoutId);
    };
  }, [token, HTTPSAPIURL, coolerLoading]);

  // Handler untuk membuka modal salin ID
  const openCopyModal = (type: "Sensor" | "Cooler", id: number) => {
    setCopyItem({ type, id });
    setCopySuccess(null);
    setCopyError(null);
    setIsCopyModalOpen(true);
  };

  // Handler untuk menutup modal salin ID
  const closeCopyModal = () => {
    setIsCopyModalOpen(false);
    setCopyItem(null);
    setCopySuccess(null);
    setCopyError(null);
  };

  // Handler untuk menyalin ID ke clipboard
  const handleCopyId = async () => {
    if (!copyItem) return;

    try {
      await navigator.clipboard.writeText(copyItem.id.toString());
      setCopySuccess("ID berhasil disalin ke clipboard!");
      setCopyError(null);
    } catch (err) {
      console.error("Gagal menyalin ID:", err);
      setCopyError("Gagal menyalin ID. Coba lagi.");
      setCopySuccess(null);
    }
  };

  // Handler untuk membuka modal mengubah mode
  const openChangeModeModal = (cooler: Cooler) => {
    setCoolerToChangeMode(cooler);
    setChangeMode({
      coolerId: cooler.id,
      mode: cooler.latestData?.mode || "DEFAULT",
    });
    setIsChangeModeModalOpen(true);
  };

  // Handler untuk menutup modal mengubah mode
  const closeChangeModeModal = () => {
    setIsChangeModeModalOpen(false);
    setCoolerToChangeMode(null);
    setChangeMode({
      coolerId: 0,
      mode: "DEFAULT",
    });
  };

  // Handler untuk perubahan input dalam modal mengubah mode
  const handleChangeModeInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setChangeMode((prev) => ({
      ...prev,
      mode: value,
    }));
  };

  // Handler untuk submit perubahan mode
  const handleChangeModeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/changemode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coolerId: changeMode.coolerId,
          mode: changeMode.mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengubah mode cooler.");
      }

      const updatedCooler: Cooler = await response.json();

      // Update cooler dalam state
      setCoolers((prev) =>
        prev.map((cooler) => (cooler.id === updatedCooler.id ? updatedCooler : cooler))
      );

      closeChangeModeModal();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengubah mode cooler.");
    }
  };

  // Handler untuk membuka modal mengubah speed
  const openChangeSpeedModal = (cooler: Cooler) => {
    setCoolerToChangeSpeed(cooler);
    setChangeSpeed({
      coolerId: cooler.id,
      speed: cooler.latestData?.speed || 0,
    });
    setIsChangeSpeedModalOpen(true);
  };

  // Handler untuk menutup modal mengubah speed
  const closeChangeSpeedModal = () => {
    setIsChangeSpeedModalOpen(false);
    setCoolerToChangeSpeed(null);
    setChangeSpeed({
      coolerId: 0,
      speed: 0,
    });
  };

  // Menggunakan hook useDebounce untuk speed
  const debouncedSpeed = useDebounce(changeSpeed.speed, 500); // Debounce 500ms

  // useEffect untuk mengirim permintaan API setelah speed di-debounce
  useEffect(() => {
    if (coolerToChangeSpeed && debouncedSpeed !== (coolerToChangeSpeed.latestData?.speed || 0)) {
      sendSpeedUpdate(coolerToChangeSpeed.id, debouncedSpeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSpeed]);

  // Fungsi untuk mengirim speed update secara langsung
  const sendSpeedUpdate = async (coolerId: number, speed: number) => {
    try {
      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/changespeed`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coolerId,
          speed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengubah speed cooler.");
      }

      const updatedCooler: Cooler = await response.json();

      // Update cooler dalam state
      setCoolers((prev) =>
        prev.map((cooler) => (cooler.id === updatedCooler.id ? updatedCooler : cooler))
      );

      // Optional: Tampilkan pesan sukses atau log
      console.log("Speed berhasil diubah:", updatedCooler.latestData?.speed);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengubah speed cooler.");
    }
  };

  // Handler untuk perubahan input dalam modal mengubah speed
  const handleChangeSpeedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const speed = Math.min(100, Math.max(0, Number(value))); // Validasi 0-100
    setChangeSpeed((prev) => ({
      ...prev,
      speed,
    }));
  };

  // Filter sensor dan cooler berdasarkan search term
  const filteredSensors = sensors.filter((sensor) =>
    sensor.name.toLowerCase().includes(sensorSearchTerm.toLowerCase())
  );

  const filteredCoolers = coolers.filter((cooler) =>
    cooler.name.toLowerCase().includes(coolerSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
      {/* Toggle Dark Mode Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleDarkMode}
          className="flex items-center space-x-2 rounded-md bg-gray-200 dark:bg-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
        >
          {isDarkMode ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.22a1 1 0 011.415 1.415l-.707.707a1 1 0 11-1.414-1.414l.707-.708zM18 9a1 1 0 110 2h-1a1 1 0 110-2h1zM15.657 14.657a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-1.22a1 1 0 00-1.415 1.415l.707.707a1 1 0 001.414-1.414l-.707-.708zM4 9a1 1 0 100 2H3a1 1 0 100-2h1zm1.343-4.657a1 1 0 10-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 5a5 5 0 100 10 5 5 0 000-10z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.415 1.415l-.707.707a1 1 0 11-1.414-1.414l.707-.708zM10 18a1 1 0 110 2h1a1 1 0 110-2h-1zM15.78 15.78a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM10 14a4 4 0 100-8 4 4 0 000 8zm-4.22-1.22a1 1 0 00-1.415 1.415l.707.707a1 1 0 001.414-1.414l-.707-.708zM4 10a1 1 0 100 2H3a1 1 0 100-2h1zm1.343-4.657a1 1 0 10-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
              </svg>
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <h1 className="mb-8 text-4xl font-bold text-center text-gray-800 dark:text-gray-100">
        Monitor Realtime Cooler dan Sensor
      </h1>

      {/* Sensor Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">Sensor</h2>
        {/* Search Sensor */}
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            value={sensorSearchTerm}
            onChange={(e) => setSensorSearchTerm(e.target.value)}
            placeholder="Cari sensor..."
            className="w-1/3 rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
          />
        </div>

        {/* Kondisi Loading */}
        {sensorLoading && (
          <div className="flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Memuat data sensor...</p>
          </div>
        )}

        {/* Kondisi Error */}
        {sensorError && (
          <div className="flex items-center justify-center">
            <p className="text-red-500 dark:text-red-400">{sensorError}</p>
          </div>
        )}

        {/* Display Sensor Data */}
        {!sensorLoading && !sensorError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSensors.map((sensor) => (
              <div
                key={sensor.id}
                className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-md transition-colors duration-300"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{sensor.name}</h3>
                  <button
                    onClick={() => openCopyModal("Sensor", sensor.id)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 transition-colors duration-300"
                    title="Salin ID"
                  >
                    <FiCopy size={20} />
                  </button>
                </div>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Suhu:</span> {sensor.latestData ? `${sensor.latestData.temperature}°C` : "N/A"}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Kelembaban:</span> {sensor.latestData ? `${sensor.latestData.humidity}%` : "N/A"}
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Dibuat pada: {new Date(sensor.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {filteredSensors.length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                Tidak ada data yang ditemukan.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Cooler Section */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">Cooler</h2>
        {/* Search Cooler */}
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            value={coolerSearchTerm}
            onChange={(e) => setCoolerSearchTerm(e.target.value)}
            placeholder="Cari cooler..."
            className="w-1/3 rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
          />
        </div>

        {/* Kondisi Loading */}
        {coolerLoading && (
          <div className="flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Memuat data cooler...</p>
          </div>
        )}

        {/* Kondisi Error */}
        {coolerError && (
          <div className="flex items-center justify-center">
            <p className="text-red-500 dark:text-red-400">{coolerError}</p>
          </div>
        )}

        {/* Display Cooler Data */}
        {!coolerLoading && !coolerError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCoolers.map((cooler) => (
              <div
                key={cooler.id}
                className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-md transition-colors duration-300"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{cooler.name}</h3>
                  <button
                    onClick={() => openCopyModal("Cooler", cooler.id)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 transition-colors duration-300"
                    title="Salin ID"
                  >
                    <FiCopy size={20} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Mode:</span> {cooler.latestData?.mode || "N/A"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Speed:</span> {cooler.latestData ? `${cooler.latestData.speed}%` : "N/A"}
                    </p>
                  </div>
                  {/* Animasi Cooler */}
                  <CoolerAnimation speed={cooler.latestData?.speed || 0} />
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => openChangeModeModal(cooler)}
                    className="flex items-center space-x-1 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-600 transition-colors duration-300"
                    title="Ubah Mode"
                  >
                    <BsFillGearFill size={20} />
                    <span>Mode</span>
                  </button>
                  {cooler.latestData?.mode === "MANUAL" && (
                    <button
                      onClick={() => openChangeSpeedModal(cooler)}
                      className="flex items-center space-x-1 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-600 transition-colors duration-300"
                      title="Ubah Speed"
                    >
                      <span>Speed</span>
                      {/* Anda dapat mengganti ini dengan ikon slider */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M3 10a7 7 0 1114 0 7 7 0 01-14 0zM9.293 5.293a1 1 0 011.414 0L13 7.586V4a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 010-2h2.414l-2.707-2.707a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredCoolers.length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                Tidak ada data yang ditemukan.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal Salin ID */}
      {isCopyModalOpen && copyItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCopyModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg transition-colors duration-300"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Salin ID {copyItem.type}
            </h2>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>ID {copyItem.type}:</strong> {copyItem.id}
              </p>
              <button
                onClick={handleCopyId}
                className="mt-2 rounded-md bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
              >
                Salin ID
              </button>
              {copySuccess && <p className="mt-2 text-green-500">{copySuccess}</p>}
              {copyError && <p className="mt-2 text-red-500">{copyError}</p>}
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeCopyModal}
                className="rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mengubah Mode Cooler */}
      {isChangeModeModalOpen && coolerToChangeMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeChangeModeModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg transition-colors duration-300"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Ubah Mode Cooler
            </h2>
            <form onSubmit={handleChangeModeSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">Mode</label>
                <select
                  name="mode"
                  value={changeMode.mode}
                  onChange={handleChangeModeInputChange}
                  className="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
                  required
                >
                  {modeOptions.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeChangeModeModal}
                  className="mr-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="hover:bg-blue-600 rounded-md bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300"
                >
                  Ubah Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mengubah Speed Cooler */}
      {isChangeSpeedModalOpen && coolerToChangeSpeed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeChangeSpeedModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Ubah Speed Cooler
            </h2>
            <div className="mb-4">
              <label className="mb-2 block text-gray-700 dark:text-gray-300">Speed (%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={changeSpeed.speed}
                onChange={handleChangeSpeedInputChange}
                className="w-full"
                required
              />
              <p className="mt-2 text-center text-gray-700 dark:text-gray-300">{changeSpeed.speed}%</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeChangeSpeedModal}
                className="mr-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitor;