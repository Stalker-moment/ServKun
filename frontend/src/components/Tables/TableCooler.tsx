// components/TableCooler.tsx
"use client"; // Menandai komponen sebagai Client Component

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { FiEdit3, FiCopy } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

// Definisikan tipe data yang diterima dari WebSocket
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

const TableCooler: React.FC = () => {
  const [coolers, setCoolers] = useState<Cooler[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<string>(""); // Status WebSocket untuk debugging
  const [searchTerm, setSearchTerm] = useState<string>(""); // State untuk input pencarian
  const [keyword, setKeyword] = useState<string>(""); // State keyword untuk WebSocket

  // State untuk modal penambahan cooler
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCooler, setNewCooler] = useState<{ name: string }>({ name: "" });

  // State untuk modal penghapusan cooler
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [coolerToDelete, setCoolerToDelete] = useState<Cooler | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State untuk modal edit cooler
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [coolerToEdit, setCoolerToEdit] = useState<Cooler | null>(null);
  const [editCooler, setEditCooler] = useState<{ coolerId: number; name: string }>({
    coolerId: 0,
    name: "",
  });

  // State untuk modal salin ID cooler
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [coolerToCopy, setCoolerToCopy] = useState<Cooler | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // State untuk modal mengubah mode cooler
  const [isChangeModeModalOpen, setIsChangeModeModalOpen] = useState<boolean>(false);
  const [coolerToChangeMode, setCoolerToChangeMode] = useState<Cooler | null>(null);
  const [changeMode, setChangeMode] = useState<{ coolerId: number; mode: string }>({
    coolerId: 0,
    mode: "DEFAULT",
  });
  const modeOptions = ["DEFAULT", "ATEMP", "ACLOCK", "MANUAL"] as const;

  // State untuk modal mengubah speed cooler
  const [isChangeSpeedModalOpen, setIsChangeSpeedModalOpen] = useState<boolean>(false);
  const [coolerToChangeSpeed, setCoolerToChangeSpeed] = useState<Cooler | null>(null);
  const [changeSpeed, setChangeSpeed] = useState<{ coolerId: number; speed: number }>({
    coolerId: 0,
    speed: 0,
  });

  useEffect(() => {
    // Membuat URL WebSocket dengan token dan keyword
    const token = Cookies.get("userAuth");
    if (!token) {
      setError("Token autentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    console.log("Token autentikasi:", token); // Logging token

    const wsUrl = `wss://${HTTPSAPIURL}/dataCooler?token=${token}&search=${encodeURIComponent(
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
          setCoolers(parsedData as Cooler[]);
          console.log("Data cooler berhasil diperbarui:", parsedData);
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.coolers && Array.isArray(parsedData.coolers)) {
          // Jika data dibungkus dalam objek dengan properti 'coolers'
          setCoolers(parsedData.coolers as Cooler[]);
          console.log(
            "Data cooler berhasil diperbarui dari properti 'coolers':",
            parsedData.coolers
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

  // Handler untuk membuka modal penambahan cooler
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Handler untuk menutup modal penambahan cooler
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form
    setNewCooler({ name: "" });
  };

  // Handler untuk perubahan input dalam modal penambahan cooler
  const handleModalInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCooler((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form penambahan cooler
  const handleAddCoolerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
        },
        body: JSON.stringify(newCooler),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambahkan cooler.");
      }

      const addedCooler = await response.json();
      // Tambahkan cooler baru ke daftar
      setCoolers((prev) => [...prev, addedCooler]);
      closeModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menambahkan cooler.");
    }
  };

  // Handler untuk membuka modal konfirmasi penghapusan cooler
  const openDeleteModal = (cooler: Cooler) => {
    setCoolerToDelete(cooler);
    setDeleteConfirmationInput("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handler untuk menutup modal konfirmasi penghapusan cooler
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCoolerToDelete(null);
    setDeleteConfirmationInput("");
    setDeleteError(null);
  };

  // Handler untuk perubahan input konfirmasi penghapusan cooler
  const handleDeleteConfirmationInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDeleteConfirmationInput(e.target.value);
  };

  // Handler untuk submit penghapusan cooler
  const handleDeleteCooler = async () => {
    if (!coolerToDelete) return;

    // Validasi input konfirmasi
    if (deleteConfirmationInput !== coolerToDelete.name) {
      setDeleteError(
        `Konfirmasi tidak sesuai. Silakan ketik ulang ${coolerToDelete.name} untuk menghapus cooler.`
      );
      return;
    }

    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setDeleteError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/edit`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
        },
        body: JSON.stringify({ coolerId: coolerToDelete.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus cooler.");
      }

      // Jika berhasil, hapus cooler dari state
      setCoolers((prev) => prev.filter((cooler) => cooler.id !== coolerToDelete.id));
      closeDeleteModal();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Gagal menghapus cooler.");
    }
  };

  // Handler untuk membuka modal edit cooler
  const openEditModal = (cooler: Cooler) => {
    setCoolerToEdit(cooler);
    setEditCooler({
      coolerId: cooler.id,
      name: cooler.name,
    });
    setIsEditModalOpen(true);
  };

  // Handler untuk menutup modal edit cooler
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCoolerToEdit(null);
    setEditCooler({
      coolerId: 0,
      name: "",
    });
  };

  // Handler untuk perubahan input dalam modal edit cooler
  const handleEditCoolerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCooler((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form edit cooler
  const handleEditCoolerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
        },
        body: JSON.stringify({
          coolerId: editCooler.coolerId,
          name: editCooler.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengedit cooler.");
      }

      const updatedCooler = await response.json();

      // Update cooler dalam state
      setCoolers((prev) =>
        prev.map((cooler) =>
          cooler.id === updatedCooler.id ? updatedCooler : cooler
        )
      );

      closeEditModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengedit cooler.");
    }
  };

  // Handler untuk membuka modal salin ID
  const openCopyModal = (cooler: Cooler) => {
    setCoolerToCopy(cooler);
    setCopySuccess(null);
    setCopyError(null);
    setIsCopyModalOpen(true);
  };

  // Handler untuk menutup modal salin ID
  const closeCopyModal = () => {
    setIsCopyModalOpen(false);
    setCoolerToCopy(null);
    setCopySuccess(null);
    setCopyError(null);
  };

  // Handler untuk menyalin ID cooler
  const handleCopyId = async () => {
    if (!coolerToCopy) return;

    try {
      await navigator.clipboard.writeText(coolerToCopy.id.toString());
      setCopySuccess("ID berhasil disalin ke clipboard!");
      setCopyError(null);
    } catch (err) {
      console.error("Gagal menyalin ID:", err);
      setCopyError("Gagal menyalin ID. Coba lagi.");
      setCopySuccess(null);
    }
  };

  // Handler untuk membuka modal mengubah mode cooler
  const openChangeModeModal = (cooler: Cooler) => {
    setCoolerToChangeMode(cooler);
    setChangeMode({
      coolerId: cooler.id,
      mode: cooler.latestData?.mode || "DEFAULT",
    });
    setIsChangeModeModalOpen(true);
  };

  // Handler untuk menutup modal mengubah mode cooler
  const closeChangeModeModal = () => {
    setIsChangeModeModalOpen(false);
    setCoolerToChangeMode(null);
    setChangeMode({
      coolerId: 0,
      mode: "DEFAULT",
    });
  };

  // Handler untuk perubahan input dalam modal mengubah mode cooler
  const handleChangeModeInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setChangeMode((prev) => ({
      ...prev,
      mode: value,
    }));
  };

  // Handler untuk submit perubahan mode cooler
  const handleChangeModeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

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

      const updatedCooler = await response.json();

      // Update cooler dalam state
      setCoolers((prev) =>
        prev.map((cooler) =>
          cooler.id === updatedCooler.id ? updatedCooler : cooler
        )
      );

      closeChangeModeModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengubah mode cooler.");
    }
  };

  // Handler untuk membuka modal mengubah speed cooler
  const openChangeSpeedModal = (cooler: Cooler) => {
    if (cooler.latestData?.mode !== "MANUAL") {
      alert("Kecepatan hanya dapat diubah saat mode MANUAL.");
      return;
    }
    setCoolerToChangeSpeed(cooler);
    setChangeSpeed({
      coolerId: cooler.id,
      speed: cooler.latestData?.speed || 0,
    });
    setIsChangeSpeedModalOpen(true);
  };

  // Handler untuk menutup modal mengubah speed cooler
  const closeChangeSpeedModal = () => {
    setIsChangeSpeedModalOpen(false);
    setCoolerToChangeSpeed(null);
    setChangeSpeed({
      coolerId: 0,
      speed: 0,
    });
  };

  // Handler untuk perubahan input dalam modal mengubah speed cooler
  const handleChangeSpeedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setChangeSpeed((prev) => ({
      ...prev,
      speed: Number(value),
    }));
  };

  // Handler untuk submit perubahan speed cooler
  const handleChangeSpeedSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(`https://${HTTPSAPIURL}/api/cooler/changespeed`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coolerId: changeSpeed.coolerId,
          speed: changeSpeed.speed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengubah speed cooler.");
      }

      const updatedCooler = await response.json();

      // Update cooler dalam state
      setCoolers((prev) =>
        prev.map((cooler) =>
          cooler.id === updatedCooler.id ? updatedCooler : cooler
        )
      );

      closeChangeSpeedModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengubah speed cooler.");
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {/* Search Bar dan Add Cooler Button */}
      <div className="mb-4 flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Cari cooler..."
            className="flex-1 rounded-l-md border border-stroke px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="hover:bg-primary-dark rounded-r-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cari
          </button>
        </form>
        {/* Tombol Add Cooler */}
        <button
          onClick={openModal}
          className="ml-4 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Add
        </button>
      </div>

      {/* Modal untuk Menambahkan Cooler */}
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
              Tambah Cooler Baru
            </h2>
            <form onSubmit={handleAddCoolerSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Nama Cooler
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCooler.name}
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

      {/* Modal Edit Cooler */}
      {isEditModalOpen && coolerToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Edit Cooler
            </h2>
            <form onSubmit={handleEditCoolerSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Nama Cooler
                </label>
                <input
                  type="text"
                  name="name"
                  value={editCooler.name}
                  onChange={handleEditCoolerInputChange}
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

      {/* Modal Konfirmasi Penghapusan Cooler */}
      {isDeleteModalOpen && coolerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDeleteModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Konfirmasi Penghapusan Cooler
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus cooler <strong>{coolerToDelete.name}</strong>? Untuk mengonfirmasi, ketik ulang <strong>{coolerToDelete.name}</strong> di bawah ini.
            </p>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={handleDeleteConfirmationInputChange}
              placeholder={`Ketik ulang ${coolerToDelete.name}`}
              className="mb-4 w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
            />
            {deleteError && <div className="mb-4 text-red-500">{deleteError}</div>}
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
                onClick={handleDeleteCooler}
                disabled={deleteConfirmationInput !== coolerToDelete.name}
                className={`rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  deleteConfirmationInput === coolerToDelete.name
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

      {/* Modal Salin ID Cooler */}
      {isCopyModalOpen && coolerToCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCopyModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Salin ID Cooler
            </h2>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>ID Cooler:</strong> {coolerToCopy.id}
              </p>
              <button
                onClick={handleCopyId}
                className="mt-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
              >
                Salin ID
              </button>
              {copySuccess && <p className="mt-2 text-green-500">{copySuccess}</p>}
              {copyError && <p className="mt-2 text-red-500">{copyError}</p>}
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

      {/* Modal Mengubah Mode Cooler */}
      {isChangeModeModalOpen && coolerToChangeMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeChangeModeModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Ubah Mode Cooler
            </h2>
            <form onSubmit={handleChangeModeSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Mode
                </label>
                <select
                  name="mode"
                  value={changeMode.mode}
                  onChange={handleChangeModeInputChange}
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  required
                >
                  {modeOptions.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeChangeModeModal}
                  className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="hover:bg-primary-dark dark:hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:focus:ring-primary"
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
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Ubah Speed Cooler
            </h2>
            <form onSubmit={handleChangeSpeedSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Speed (%)
                </label>
                <input
                  type="number"
                  name="speed"
                  value={changeSpeed.speed}
                  onChange={handleChangeSpeedInputChange}
                  required
                  min={0}
                  max={100}
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeChangeSpeedModal}
                  className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="hover:bg-primary-dark dark:hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:focus:ring-primary"
                >
                  Ubah Speed
                </button>
              </div>
            </form>
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

      {/* Tabel Cooler */}
      {!loading && !error && !serverError && (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                <th className="min-w-[220px] px-4 py-4 font-medium text-dark dark:text-white xl:pl-7.5">
                  Nama Cooler
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                  Mode
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                  Speed (%)
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {coolers.map((cooler) => (
                <tr key={cooler.id}>
                  {/* Nama Cooler */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pl-7.5">
                    <p className="text-dark dark:text-white">{cooler.name}</p>
                    <p className="mt-[3px] text-body-sm font-medium dark:text-gray-300">
                      Dibuat pada: {new Date(cooler.createdAt).toLocaleString()}
                    </p>
                  </td>
                  {/* Mode */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p className="text-dark dark:text-white">{cooler.latestData?.mode || "N/A"}</p>
                  </td>
                  {/* Speed */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p className="text-dark dark:text-white">
                      {cooler.latestData?.mode === "MANUAL"
                        ? `${cooler.latestData.speed}%`
                        : "N/A"}
                    </p>
                  </td>
                  {/* Actions */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pr-7.5">
                    <div className="flex items-center justify-end space-x-3.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(cooler)}
                        className="hover:text-primary"
                        title="Edit"
                      >
                        <FiEdit3 />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(cooler)}
                        className="hover:text-primary"
                        title="Delete"
                      >
                        <MdDeleteForever />
                      </button>
                      {/* Copy ID Button */}
                      <button
                        onClick={() => openCopyModal(cooler)}
                        className="hover:text-primary"
                        title="Salin ID"
                      >
                        <FiCopy />
                      </button>
                      {/* Change Mode Button */}
                      <button
                        onClick={() => openChangeModeModal(cooler)}
                        className="hover:text-primary"
                        title="Ubah Mode"
                      >
                        {/* Anda bisa mengganti ikon sesuai preferensi */}
                        <span className="text-sm text-blue-500">Mode</span>
                      </button>
                      {/* Change Speed Button */}
                      {cooler.latestData?.mode === "MANUAL" && (
                        <button
                          onClick={() => openChangeSpeedModal(cooler)}
                          className="hover:text-primary"
                          title="Ubah Speed"
                        >
                          {/* Anda bisa mengganti ikon sesuai preferensi */}
                          <span className="text-sm text-blue-500">Speed</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {coolers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
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

export default TableCooler;