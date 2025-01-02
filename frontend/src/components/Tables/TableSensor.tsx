// components/TableSensor.tsx
"use client"; // Menandai komponen sebagai Client Component

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { FiEdit3, FiCopy } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";

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

const TableSensor: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<string>(""); // Status WebSocket untuk debugging
  const [searchTerm, setSearchTerm] = useState<string>(""); // State untuk input pencarian
  const [keyword, setKeyword] = useState<string>(""); // State keyword untuk WebSocket

  // State untuk modal penambahan sensor
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newSensor, setNewSensor] = useState<{ name: string }>({
    name: "",
  });

  // State untuk modal penghapusan sensor
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [sensorToDelete, setSensorToDelete] = useState<Sensor | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] =
    useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State untuk modal edit sensor
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [sensorToEdit, setSensorToEdit] = useState<Sensor | null>(null);
  const [editSensor, setEditSensor] = useState<{ sensorId: number; name: string }>({
    sensorId: 0,
    name: "",
  });

  // State untuk modal salin ID sensor
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [sensorToCopy, setSensorToCopy] = useState<Sensor | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    // Membuat URL WebSocket dengan token dan keyword
    const token = Cookies.get("userAuth");
    if (!token) {
      setError("Token autentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    console.log("Token autentikasi:", token); // Logging token

    const wsUrl = `wss://${HTTPSAPIURL}/dataSensor?token=${token}&search=${encodeURIComponent(
      keyword,
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
          setSensors(parsedData as Sensor[]);
          console.log("Data sensor berhasil diperbarui:", parsedData);
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.sensors && Array.isArray(parsedData.sensors)) {
          // Jika data dibungkus dalam objek dengan properti 'sensors'
          setSensors(parsedData.sensors as Sensor[]);
          console.log(
            "Data sensor berhasil diperbarui dari properti 'sensors':",
            parsedData.sensors,
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

  // Handler untuk membuka modal penambahan sensor
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Handler untuk menutup modal penambahan sensor
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form
    setNewSensor({ name: "" });
  };

  // Handler untuk perubahan input dalam modal penambahan sensor
  const handleModalInputChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setNewSensor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form penambahan sensor
  const handleAddSensorSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/sensor/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify(newSensor),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambahkan sensor.");
      }

      const addedSensor = await response.json();
      // Tambahkan sensor baru ke daftar
      setSensors((prev) => [...prev, addedSensor]);
      closeModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menambahkan sensor.");
    }
  };

  // Handler untuk membuka modal konfirmasi penghapusan
  const openDeleteModal = (sensor: Sensor) => {
    setSensorToDelete(sensor);
    setDeleteConfirmationInput("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handler untuk menutup modal konfirmasi penghapusan
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSensorToDelete(null);
    setDeleteConfirmationInput("");
    setDeleteError(null);
  };

  // Handler untuk perubahan input konfirmasi penghapusan
  const handleDeleteConfirmationInputChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setDeleteConfirmationInput(e.target.value);
  };

  // Handler untuk submit penghapusan sensor
  const handleDeleteSensor = async () => {
    if (!sensorToDelete) return;

    // Validasi input konfirmasi
    if (deleteConfirmationInput !== sensorToDelete.name) {
      setDeleteError(
        `Konfirmasi tidak sesuai. Silakan ketik ulang ${sensorToDelete.name} untuk menghapus sensor.`,
      );
      return;
    }

    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setDeleteError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/sensor/edit`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify({ sensorId: sensorToDelete.id }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus sensor.");
      }

      // Jika berhasil, hapus sensor dari state
      setSensors((prev) =>
        prev.filter((sensor) => sensor.id !== sensorToDelete.id),
      );
      closeDeleteModal();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Gagal menghapus sensor.");
    }
  };

  // Handler untuk membuka modal edit sensor
  const openEditModal = (sensor: Sensor) => {
    setSensorToEdit(sensor);
    setEditSensor({
      sensorId: sensor.id,
      name: sensor.name,
    });
    setIsEditModalOpen(true);
  };

  // Handler untuk menutup modal edit sensor
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSensorToEdit(null);
    setEditSensor({
      sensorId: 0,
      name: "",
    });
  };

  // Handler untuk perubahan input dalam modal edit sensor
  const handleEditModalInputChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setEditSensor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form edit sensor
  const handleEditSensorSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/sensor/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify({
            sensorId: editSensor.sensorId,
            name: editSensor.name,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengedit sensor.");
      }

      const updatedSensor = await response.json();

      // Update sensor dalam state
      setSensors((prev) =>
        prev.map((sensor) =>
          sensor.id === updatedSensor.id ? updatedSensor : sensor,
        ),
      );

      closeEditModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengedit sensor.");
    }
  };

  // Handler untuk membuka modal salin ID
  const openCopyModal = (sensor: Sensor) => {
    setSensorToCopy(sensor);
    setCopySuccess(null);
    setCopyError(null);
    setIsCopyModalOpen(true);
  };

  // Handler untuk menutup modal salin ID
  const closeCopyModal = () => {
    setIsCopyModalOpen(false);
    setSensorToCopy(null);
    setCopySuccess(null);
    setCopyError(null);
  };

  // Handler untuk menyalin ID sensor
  const handleCopyId = async () => {
    if (!sensorToCopy) return;

    try {
      await navigator.clipboard.writeText(sensorToCopy.id.toString());
      setCopySuccess("ID berhasil disalin ke clipboard!");
      setCopyError(null);
    } catch (err) {
      console.error("Gagal menyalin ID:", err);
      setCopyError("Gagal menyalin ID. Coba lagi.");
      setCopySuccess(null);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {/* Search Bar dan Add Sensor Button */}
      <div className="mb-4 flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Cari sensor..."
            className="flex-1 rounded-l-md border border-stroke px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="hover:bg-primary-dark rounded-r-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cari
          </button>
        </form>
        {/* Tombol Add Sensor */}
        <button
          onClick={openModal}
          className="ml-4 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Add
        </button>
      </div>

      {/* Modal untuk Menambahkan Sensor */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Tambah Sensor Baru
            </h2>
            <form onSubmit={handleAddSensorSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Nama Sensor
                </label>
                <input
                  type="text"
                  name="name"
                  value={newSensor.name}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="hover:bg-primary-dark dark:hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:focus:ring-primary"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Sensor */}
      {isEditModalOpen && sensorToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Edit Sensor
            </h2>
            <form onSubmit={handleEditSensorSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Nama Sensor
                </label>
                <input
                  type="text"
                  name="name"
                  value={editSensor.name}
                  onChange={handleEditModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="hover:bg-primary-dark dark:hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:focus:ring-primary"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Penghapusan Sensor */}
      {isDeleteModalOpen && sensorToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDeleteModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Konfirmasi Penghapusan Sensor
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus sensor{" "}
              <strong>{sensorToDelete.name}</strong>? Untuk mengonfirmasi,
              ketik ulang <strong>{sensorToDelete.name}</strong> di bawah ini.
            </p>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={handleDeleteConfirmationInputChange}
              placeholder={`Ketik ulang ${sensorToDelete.name}`}
              className="mb-4 w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
            />
            {deleteError && (
              <div className="mb-4 text-red-500">{deleteError}</div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSensor}
                disabled={deleteConfirmationInput !== sensorToDelete.name}
                className={`rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  deleteConfirmationInput === sensorToDelete.name
                    ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    : "cursor-not-allowed bg-red-300 dark:bg-red-300"
                }`}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salin ID Sensor */}
      {isCopyModalOpen && sensorToCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCopyModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Salin ID Sensor
            </h2>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>ID Sensor:</strong> {sensorToCopy.id}
              </p>
              <button
                onClick={handleCopyId}
                className="mt-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
              >
                Salin ID
              </button>
              {copySuccess && (
                <p className="mt-2 text-green-500">{copySuccess}</p>
              )}
              {copyError && (
                <p className="mt-2 text-red-500">{copyError}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeCopyModal}
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

      {/* Tabel Sensor */}
      {!loading && !error && !serverError && (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                <th className="min-w-[220px] px-4 py-4 font-medium text-dark dark:text-white xl:pl-7.5">
                  Nama Sensor
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                  Suhu (°C)
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                  Kelembaban (%)
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((sensor) => (
                <tr key={sensor.id}>
                  {/* Nama Sensor */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pl-7.5">
                    <p className="text-dark dark:text-white">{sensor.name}</p>
                    <p className="mt-[3px] text-body-sm font-medium dark:text-gray-300">
                      Dibuat pada: {new Date(sensor.createdAt).toLocaleString()}
                    </p>
                  </td>
                  {/* Suhu */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p className="text-dark dark:text-white">
                      {sensor.latestData ? sensor.latestData.temperature : "N/A"}
                    </p>
                  </td>
                  {/* Kelembaban */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p className="text-dark dark:text-white">
                      {sensor.latestData ? sensor.latestData.humidity : "N/A"}
                    </p>
                  </td>
                  {/* Actions */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pr-7.5">
                    <div className="flex items-center justify-end space-x-3.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(sensor)}
                        className="hover:text-primary"
                        title="Edit"
                      >
                        <FiEdit3 />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(sensor)}
                        className="hover:text-primary"
                        title="Delete"
                      >
                        <MdDeleteForever />
                      </button>
                      {/* Copy ID Button */}
                      <button
                        onClick={() => openCopyModal(sensor)}
                        className="hover:text-primary"
                        title="Salin ID"
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sensors.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
      )}
    </div>
  );
};

export default TableSensor;
