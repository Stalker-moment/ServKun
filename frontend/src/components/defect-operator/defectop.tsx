// components/TableDefect.tsx
"use client"; // Menandai komponen sebagai Client Component

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import Cookies from "js-cookie";

import { FiEdit3 } from "react-icons/fi";
import { LuEye } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

// Definisikan tipe data yang diterima dari WebSocket
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  noReg: string | null;
  createdAt: string;
  updatedAt: string;
  picture: string;
}

interface Session {
  id: string;
  token: string;
  accountId: string;
  expiredAt: string;
  device: string;
  ip: string;
  region: string;
  city: string;
  loc: string; // Format: "latitude,longitude"
  org: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

interface Account {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
  sessions: Session[];
}

// Props yang dibutuhkan oleh komponen TableDefect
const TableDefect: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<string>(""); // Status WebSocket untuk debugging
  const [searchTerm, setSearchTerm] = useState<string>(""); // State untuk input pencarian
  const [keyword, setKeyword] = useState<string>(""); // State keyword untuk WebSocket

  // State untuk modal penambahan akun
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  // State untuk modal penghapusan akun
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] =
    useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State untuk modal detail akun
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [accountDetails, setAccountDetails] = useState<Account | null>(null);

  // State untuk modal edit akun
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [editAccount, setEditAccount] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    noreg: string | null;
  }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    noreg: "",
  });

  // State untuk sesi
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] =
    useState<boolean>(false);

  // State untuk remote logout
  const [remoteLogoutLoading, setRemoteLogoutLoading] = useState<boolean>(false);
  const [remoteLogoutError, setRemoteLogoutError] = useState<string | null>(null);

  useEffect(() => {
    // Membuat URL WebSocket dengan token dan keyword
    const token = Cookies.get("userAuth");
    if (!token) {
      setError("Token autentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    console.log("Token autentikasi:", token); // Logging token

    const wsUrl = `wss://${HTTPSAPIURL}/accounts?token=${token}&search=${encodeURIComponent(
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

        // Periksa apakah data adalah array
        if (Array.isArray(parsedData)) {
          setAccounts(parsedData as Account[]);
          console.log("Data akun berhasil diperbarui:", parsedData);
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.accounts && Array.isArray(parsedData.accounts)) {
          // Jika data dibungkus dalam objek dengan properti 'accounts'
          setAccounts(parsedData.accounts as Account[]);
          console.log(
            "Data akun berhasil diperbarui dari properti 'accounts':",
            parsedData.accounts,
          );
          setLoading(false);
          clearTimeout(timeoutId); // Data diterima, batalkan timeout
        } else if (parsedData.error) {
          // Jika server mengirimkan pesan kesalahan
          console.error("Kesalahan dari server:", parsedData.error);
          setError(parsedData.error);
          setLoading(false);
          clearTimeout(timeoutId); // Kesalahan diterima, batalkan timeout
        } else {
          // Jika data bukan array atau tidak sesuai, log tapi tidak set error
          console.warn("Format data yang diterima tidak dikenali:", parsedData);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        setError("Gagal memuat data.");
        setLoading(false);
        clearTimeout(timeoutId); // Kesalahan parsing, batalkan timeout
      }
    };

    // Cleanup saat komponen unmount atau keyword berubah
    return () => {
      console.log("Menutup koneksi WebSocket.");
      ws.close();
      clearTimeout(timeoutId); // Bersihkan timeout saat unmount
    };
  }, [keyword, loading]); // Trigger ulang saat keyword atau loading berubah

  // Handler untuk perubahan input pencarian
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk submit form pencarian
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setKeyword(searchTerm); // Update keyword untuk trigger WebSocket
  };

  // Handler untuk membuka modal penambahan akun
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Handler untuk menutup modal penambahan akun
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form
    setNewAccount({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "",
    });
  };

  // Handler untuk perubahan input dalam modal penambahan akun
  const handleModalInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form penambahan akun
  const handleAddAccountSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Logika untuk menambahkan akun baru
    // Anda perlu menyesuaikan ini sesuai dengan API atau metode pengelolaan data Anda
    // Contoh menggunakan fetch POST request
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify(newAccount),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambahkan akun.");
      }

      const addedAccount = await response.json();
      // Tambahkan akun baru ke daftar
      setAccounts((prev) => [...prev, addedAccount]);
      closeModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menambahkan akun.");
    }
  };

  // Handler untuk membuka modal konfirmasi penghapusan
  const openDeleteModal = (account: Account) => {
    setAccountToDelete(account);
    setDeleteConfirmationInput("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Handler untuk menutup modal konfirmasi penghapusan
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
    setDeleteConfirmationInput("");
    setDeleteError(null);
  };

  // Handler untuk perubahan input konfirmasi penghapusan
  const handleDeleteConfirmationInputChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setDeleteConfirmationInput(e.target.value);
  };

  // Handler untuk submit penghapusan akun
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    // Validasi input konfirmasi
    if (deleteConfirmationInput !== accountToDelete.email) {
      setDeleteError(
        `Konfirmasi tidak sesuai. Silakan ketik ulang ${accountToDelete.email} untuk menghapus akun.`,
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
        `https://${HTTPSAPIURL}/api/users/edit/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify({ email: accountToDelete.email }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus akun.");
      }

      // Jika berhasil, hapus akun dari state
      setAccounts((prev) =>
        prev.filter((acc) => acc.id !== accountToDelete.id),
      );
      closeDeleteModal();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Gagal menghapus akun.");
    }
  };

  // Handler untuk membuka modal detail
  const openDetailModal = (account: Account) => {
    setAccountDetails(account);
    setIsDetailModalOpen(true);
  };

  // Handler untuk menutup modal detail
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setAccountDetails(null);
  };

  // Handler untuk membuka modal edit
  const openEditModal = (account: Account) => {
    setAccountToEdit(account);
    setEditAccount({
      email: account.email,
      password: "", // Biarkan kosong jika tidak ingin mengganti password
      firstName: account.contact.firstName,
      lastName: account.contact.lastName,
      phone: account.contact.phone,
      noreg: account.contact.noReg || "",
    });
    setIsEditModalOpen(true);
  };

  // Handler untuk menutup modal edit
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setAccountToEdit(null);
    setEditAccount({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      noreg: "",
    });
  };

  // Handler untuk perubahan input dalam modal edit
  const handleEditModalInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form edit
  const handleEditAccountSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        return;
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/users/edit/others`,
        {
          method: "PUT", // Atau sesuai dengan metode yang digunakan oleh API Anda
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Mengirim token dalam header Authorization
          },
          body: JSON.stringify({
            email: editAccount.email,
            password: editAccount.password,
            firstName: editAccount.firstName,
            lastName: editAccount.lastName,
            phone: editAccount.phone,
            noreg: editAccount.noreg,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengedit akun.");
      }

      const updatedAccount = await response.json();

      // Update akun dalam state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === updatedAccount.id ? updatedAccount : acc,
        ),
      );

      closeEditModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengedit akun.");
    }
  };

  // Handler untuk membuka tabel sesi
  const openSessions = () => {
    setShowSessions(true);
  };

  // Handler untuk menutup tabel sesi
  const closeSessions = () => {
    setShowSessions(false);
  };

  // Handler untuk membuka detail sesi
  const openSessionDetailModal = (session: Session) => {
    setSelectedSession(session);
    setIsSessionDetailModalOpen(true);
  };

  // Handler untuk menutup detail sesi
  const closeSessionDetailModal = () => {
    setIsSessionDetailModalOpen(false);
    setSelectedSession(null);
    // Reset remote logout error jika ada
    setRemoteLogoutError(null);
  };

  // Fungsi untuk melakukan remote logout
  const handleRemoteLogout = async (sessionId: string) => {
    setRemoteLogoutLoading(true);
    setRemoteLogoutError(null);
    try {
      const token = Cookies.get("userAuth");
      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan.");
      }

      const response = await fetch(
        `https://${HTTPSAPIURL}/api/users/remote-logout-others`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal melakukan logout.");
      }

      // Jika berhasil, hapus sesi dari state
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === accountDetails?.id) {
            return {
              ...account,
              sessions: account.sessions.filter(
                (session) => session.id !== sessionId,
              ),
            };
          }
          return account;
        }),
      );

      if (accountDetails) {
        setAccountDetails({
          ...accountDetails,
          sessions: accountDetails.sessions.filter(
            (session) => session.id !== sessionId,
          ),
        });
      }

      // Tutup modal detail sesi
      closeSessionDetailModal();
    } catch (err: any) {
      console.error(err);
      setRemoteLogoutError(err.message || "Gagal melakukan logout.");
      setTimeout(() => {
        setRemoteLogoutError(null);
      }, 3000); // Hapus pesan error setelah 3 detik
    } finally {
      setRemoteLogoutLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {/* Search Bar dan Add Account Button */}
      <div className="mb-4 flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Cari akun..."
            className="flex-1 rounded-l-md border border-stroke px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="hover:bg-primary-dark rounded-r-md bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cari
          </button>
        </form>
        {/* Tombol Add Account */}
        <button
          onClick={openModal}
          className="ml-4 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Add
        </button>
      </div>

      {/* Modal untuk Menambahkan Akun */}
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
              Tambah Akun Baru
            </h2>
            <form onSubmit={handleAddAccountSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={newAccount.firstName}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={newAccount.lastName}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Email (Cannot edit this after creation)
                </label>
                <input
                  type="email"
                  name="email"
                  value={newAccount.email}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newAccount.phone}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={newAccount.password}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  name="role"
                  value={newAccount.role}
                  onChange={handleModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                >
                  <option value="">Pilih Role</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="PPIC">PPIC</option>
                  <option value="USER">USER</option>
                </select>
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

      {/* === Modal Edit Akun === */}
      {isEditModalOpen && accountToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Edit Akun
            </h2>
            <form onSubmit={handleEditAccountSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editAccount.email}
                  onChange={handleEditModalInputChange}
                  required
                  // Jika email tidak dapat diedit, tambahkan disabled
                  // disabled
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Password (Biarkan kosong jika tidak ingin mengganti)
                </label>
                <input
                  type="password"
                  name="password"
                  value={editAccount.password}
                  onChange={handleEditModalInputChange}
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={editAccount.firstName}
                  onChange={handleEditModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={editAccount.lastName}
                  onChange={handleEditModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editAccount.phone}
                  onChange={handleEditModalInputChange}
                  required
                  className="w-full rounded-md border px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-gray-700 dark:text-gray-300">
                  No Registrasi
                </label>
                <input
                  type="text"
                  name="noreg"
                  value={editAccount.noreg ?? ""}
                  onChange={handleEditModalInputChange}
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

      {/* Modal Konfirmasi Penghapusan Akun */}
      {isDeleteModalOpen && accountToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDeleteModal} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Konfirmasi Penghapusan Akun
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong>{accountToDelete.email}</strong>? Untuk mengonfirmasi,
              ketik ulang <strong>{accountToDelete.email}</strong> di bawah ini.
            </p>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={handleDeleteConfirmationInputChange}
              placeholder={`Ketik ulang ${accountToDelete.email}`}
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
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationInput !== accountToDelete.email}
                className={`rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  deleteConfirmationInput === accountToDelete.email
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

      {/* Modal Detail Akun */}
      {isDetailModalOpen && accountDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDetailModal} // Menutup modal saat klik backdrop
        >
          <div
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Detail Akun
            </h2>
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Image
                  src={accountDetails.contact.picture}
                  alt={`${accountDetails.contact.firstName} ${accountDetails.contact.lastName}`}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {accountDetails.contact.firstName}{" "}
                    {accountDetails.contact.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {accountDetails.contact.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {accountDetails.contact.phone}
                  </p>
                </div>
              </div>
              {/* Account Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                  Informasi Akun
                </h4>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>ID:</strong> {accountDetails.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {accountDetails.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {accountDetails.role}
                  </p>
                  <p>
                    <strong>Nomor Registrasi:</strong>{" "}
                    {accountDetails.contact.noReg || "N/A"}
                  </p>
                  <p>
                    <strong>Dibuat Pada:</strong>{" "}
                    {new Date(accountDetails.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Terakhir Diperbarui:</strong>{" "}
                    {new Date(accountDetails.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Tombol Lihat Sessions */}
              <div className="mt-6">
                <button
                  onClick={openSessions}
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Lihat Sessions
                </button>
              </div>
            </div>
            {/* Tombol Tutup */}
            <div className="mt-6 flex justify-end">
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

      {/* Modal Sessions */}
      {showSessions && accountDetails && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50"
          onClick={closeSessions} // Menutup modal saat klik backdrop
        >
          <div
            className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Active Sessions
            </h2>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                    <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                      Device
                    </th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-dark dark:text-white">
                      IP
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                      City
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                      Last Accessed
                    </th>
                    <th className="px-4 py-4 text-right font-medium text-dark dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountDetails.sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                        {session.device}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                        {session.ip}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                        {session.city}, {session.region}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                        {new Date(session.lastAccessedAt).toLocaleString()}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 text-right dark:border-dark-3">
                        <button
                          onClick={() => openSessionDetailModal(session)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accountDetails.sessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="border-b border-[#eee] px-4 py-4 text-center dark:border-dark-3"
                      >
                        <p className="text-gray-500 dark:text-gray-300">
                          Tidak ada sesi yang aktif.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Tombol Tutup Sessions */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeSessions}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Sesi */}
      {isSessionDetailModalOpen && selectedSession && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeSessionDetailModal} // Menutup modal saat klik backdrop
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              Detail Session
            </h2>
            <div className="space-y-4">
              <p>
                <strong>ID:</strong> {selectedSession.id}
              </p>
              <p>
                <strong>Device:</strong> {selectedSession.device}
              </p>
              <p>
                <strong>IP:</strong> {selectedSession.ip}
              </p>
              <p>
                <strong>Region:</strong> {selectedSession.region}
              </p>
              <p>
                <strong>City:</strong> {selectedSession.city}
              </p>
              <p>
                <strong>Organization:</strong> {selectedSession.org}
              </p>
              <p>
                <strong>Timezone:</strong> {selectedSession.timezone}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(selectedSession.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Last Accessed At:</strong>{" "}
                {new Date(selectedSession.lastAccessedAt).toLocaleString()}
              </p>
              {/* Peta Lokasi */}
              <div className="mt-4">
                <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                  Lokasi Session
                </h3>
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps?q=${selectedSession.loc}&output=embed`}
                  allowFullScreen
                  title="Google Maps"
                ></iframe>
              </div>
            </div>
            {/* Tombol Tutup dan Logout */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={closeSessionDetailModal}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
              >
                Tutup
              </button>
              <button
                onClick={() => handleRemoteLogout(selectedSession.id)}
                disabled={remoteLogoutLoading}
                className={`rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  remoteLogoutLoading
                    ? "bg-red-300 cursor-not-allowed dark:bg-red-300"
                    : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                }`}
              >
                {remoteLogoutLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
            {/* Menampilkan Error jika terjadi */}
            {remoteLogoutError && (
              <div className="mt-4 text-red-500">
                {remoteLogoutError}
              </div>
            )}
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
      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-4">
          <p className="mb-2 text-red-500">{error}</p>
          <p className="text-gray-500 dark:text-gray-300">
            Status WebSocket: {wsStatus}
          </p>
        </div>
      )}

      {/* Tabel Akun */}
      {!loading && !error && (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                <th className="min-w-[220px] px-4 py-4 font-medium text-dark dark:text-white xl:pl-7.5">
                  No
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                  Line
                </th>
                <th className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                  Process
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Operator
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Defect
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  {/* Profile Picture */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pl-7.5">
                    <div className="flex items-center">
                      <Image
                        src={account.contact.picture}
                        alt={`${account.contact.firstName} ${account.contact.lastName}`}
                        width={40}
                        height={40}
                        className="mr-4 rounded-full object-cover"
                      />
                      <div>
                        <h5 className="text-dark dark:text-white">
                          {account.contact.firstName} {account.contact.lastName}
                        </h5>
                        <p className="mt-[3px] text-body-sm font-medium dark:text-gray-300">
                          {account.contact.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Name */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p className="text-dark dark:text-white">
                      {account.contact.firstName} {account.contact.lastName}
                    </p>
                  </td>
                  {/* Roles */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3">
                    <p
                      className={`inline-flex rounded-full px-3.5 py-1 text-body-sm font-medium ${
                        account.role === "ADMIN"
                          ? "bg-[#219653]/[0.08] text-[#219653]"
                          : account.role === "PPIC"
                            ? "bg-[#D34053]/[0.08] text-[#D34053]"
                            : "bg-[#FFA70B]/[0.08] text-[#FFA70B]"
                      }`}
                    >
                      {account.role}
                    </p>
                  </td>
                  {/* Actions */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-dark-3 xl:pr-7.5">
                    <div className="flex items-center justify-end space-x-3.5">
                      {/* Details Button */}
                      <button
                        onClick={() => openDetailModal(account)}
                        className="hover:text-primary"
                        title="Details"
                      >
                        <LuEye />
                      </button>
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(account)}
                        className="hover:text-primary"
                        title="Edit"
                      >
                        <FiEdit3 />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(account)}
                        className="hover:text-primary"
                        title="Delete"
                      >
                        <MdDeleteForever />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="border-[#eee] px-4 py-4 text-center dark:border-dark-3"
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

export default TableDefect;