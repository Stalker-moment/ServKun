"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import Cropper from "react-easy-crop";
import getCroppedImg from "./utils/cropImage"; // Sesuaikan jalur impor sesuai kebutuhan
import Notification from "./notification";
import { CgProfile } from "react-icons/cg";
import { BiFontSize } from "react-icons/bi";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;
const HTTPAPIURL = process.env.NEXT_PUBLIC_HTTP_API_URL;

const SettingBoxes = () => {
  // Variabel state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [noReg, setNoReg] = useState("");
  const [email, setEmail] = useState("");
  const imageDefault = `https://${HTTPSAPIURL}/files/img/profile/default.png`;
  const [picture, setPicture] = useState(imageDefault);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Variabel state baru untuk cropping
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Variabel state untuk sesi
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionNow, setSessionNow] = useState<string>(""); // Tambahkan state untuk sessionNow
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Variabel state untuk modal konfirmasi logout sesi
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false);
  const [sessionToLogout, setSessionToLogout] = useState<any>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  // Refs untuk menyimpan WebSocket dan timeout ID
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi untuk menentukan status sesi berdasarkan lastAccessedAt
  const getSessionStatus = (lastAccessedAt: string) => {
    const now = new Date();
    const lastAccessed = new Date(lastAccessedAt);
    const diffInSeconds = (now.getTime() - lastAccessed.getTime()) / 1000;
    return diffInSeconds < 60 ? "Online" : "Offline";
  };

  // Fungsi untuk menghubungkan ke WebSocket dengan rekoneksi otomatis
  const connectWebSocket = useCallback(() => {
    const authToken = Cookies.get("userAuth") || "";
    const socketUrl = `wss://${HTTPSAPIURL}/dataSessionAccount?token=${authToken}`;
    console.log("Menghubungkan ke WebSocket di:", socketUrl);

    // Membuat WebSocket baru
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);

        // Pastikan data.account.sessions dan data.account.sessionNow ada
        if (
          data &&
          data.account &&
          Array.isArray(data.account.sessions) &&
          data.account.sessionNow
        ) {
          setSessions(data.account.sessions);
          setSessionNow(data.account.sessionNow); // Tetapkan sessionNow
          console.log("Sessions diperbarui:", data.account.sessions);
          console.log("Current Session ID:", data.account.sessionNow);
        } else {
          console.log("Data tidak sesuai format yang diharapkan:", data);
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    const handleCloseOrError = (event: CloseEvent | Event) => {
      console.log(
        "WebSocket connection closed atau terjadi error. Mencoba untuk reconnect...",
      );
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      // Atur agar reconnect setelah 5 detik
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    socket.onclose = handleCloseOrError;
    socket.onerror = handleCloseOrError;
  }, []);

  // Hook untuk menghubungkan WebSocket saat komponen dimuat
  useEffect(() => {
    connectWebSocket();

    // Pembersihan ketika komponen dibongkar
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Ambil data pengguna saat komponen dimuat
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authHeader = Cookies.get("userAuth") || "";
        const response = await fetch(
          `https://${HTTPSAPIURL}/api/users/account`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setFirstName(data.contact.firstName || "");
          setLastName(data.contact.lastName || "");
          setPhone(data.contact.phone || "");
          setNoReg(data.contact.noReg || "");
          setEmail(data.contact.email || data.email || "");
          setPicture(data.contact.picture || imageDefault);
        } else {
          console.error("Gagal mengambil data pengguna");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchUserData();
  }, [imageDefault]);

  // Tangani pengiriman formulir
  interface UserData {
    firstName: string;
    lastName: string;
    phone: string;
    noReg: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const authHeader = Cookies.get("userAuth") || "";
      const body: UserData = {
        firstName,
        lastName,
        phone,
        noReg,
      };
      const response = await fetch(`https://${HTTPSAPIURL}/api/users/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        console.log("Data pengguna berhasil diperbarui");
        const responseData = await response.json();
        const newCookie = responseData.token;
        Cookies.set("userAuth", newCookie);
        window.location.reload();
      } else {
        console.error("Gagal memperbarui data pengguna");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Tangani pemilihan file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Tambahkan state untuk drag
  const [isDragging, setIsDragging] = useState(false);

  // Tangani drag and drop file
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false); // Reset setelah drop
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Tangani drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Tangani drag enter
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Tangani drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Tangani selesai crop
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Tangani konfirmasi crop
  const handleCropConfirm = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedBlob) {
          const croppedFile = new File(
            [croppedBlob],
            selectedFileName || "cropped_image.jpeg",
            { type: "image/jpeg" },
          );
          setSelectedFile(croppedFile);
          // Perbarui gambar dengan pratinjau hasil crop
          const croppedImageUrl = URL.createObjectURL(croppedBlob);
          setPicture(croppedImageUrl);
          setShowCropModal(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tangani pembatalan crop
  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setImageSrc(null);
    setSelectedFileName("");
  };

  // Upload foto profil setelah selectedFile berubah
  useEffect(() => {
    if (selectedFile) {
      uploadProfilePhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  // Upload foto profil
  const uploadProfilePhoto = async () => {
    if (!selectedFile) return;

    try {
      const authHeader = Cookies.get("userAuth") || "";
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(`https://${HTTPSAPIURL}/files/img/profile`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPicture(data.pictureUrl || "/images/user/user-03.png");
        console.log("Foto profil berhasil diperbarui");
        // Opsi: reload halaman atau perbarui state
        window.location.reload();
      } else {
        console.error("Gagal memperbarui foto profil");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Tangani konfirmasi hapus
  const confirmDelete = async () => {
    try {
      const authHeader = Cookies.get("userAuth") || "";

      const response = await fetch(`https://${HTTPSAPIURL}/files/img/profile`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      });

      if (response.ok) {
        setPicture("/images/user/user-03.png");
        console.log("Foto profil berhasil dihapus");
        window.location.reload();
      } else {
        console.error("Gagal menghapus foto profil");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Tangani klik tombol hapus
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Tangani pembatalan modal
  const handleModalCancel = () => {
    setShowDeleteModal(false);
  };

  // Handler untuk menghapus sesi remote
  const handleRemoteLogout = (session: any) => {
    // Pastikan tidak menghapus sesi saat ini
    if (session.id === sessionNow) {
      showNotification("Anda tidak dapat menghapus sesi saat ini", "error");
      return;
    }

    // Set sesi yang ingin dihapus dan buka modal konfirmasi
    setSessionToLogout(session);
    setShowConfirmLogoutModal(true);
  };

  // Handler untuk konfirmasi penghapusan sesi
  const confirmRemoteLogout = async () => {
    if (!sessionToLogout) return;

    try {
      const authHeader = Cookies.get("userAuth") || "";
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/users/remote-logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ sessionId: sessionToLogout.id }),
        },
      );

      if (response.ok) {
        console.log("Sesi berhasil dihapus");
        // Perbarui daftar sesi tanpa sesi yang dihapus
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session.id !== sessionToLogout.id),
        );
        setShowSessionModal(false);
        setShowConfirmLogoutModal(false);
        setSessionToLogout(null);
        showNotification("Sesi berhasil dihapus", "success");
      } else {
        const errorData = await response.json();
        console.error("Gagal menghapus sesi:", errorData.message);
        showNotification(`Gagal menghapus sesi: ${errorData.error}`, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("Terjadi kesalahan saat menghapus sesi", "error");
    }
  };

  // Handler untuk membatalkan penghapusan sesi
  const cancelRemoteLogout = () => {
    setShowConfirmLogoutModal(false);
    setSessionToLogout(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        {/* Formulir Informasi Pribadi */}
        <div className="xl:col-span-3">
          <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
              <h3 className="font-medium text-dark dark:text-white">
                Informasi Pribadi
              </h3>
            </div>
            <div className="p-7">
              <form onSubmit={handleSubmit}>
                {/* Nama Depan dan Belakang */}
                <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  {/* Nama Depan */}
                  <div className="w-full sm:w-1/2">
                    <label
                      className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                      htmlFor="firstName"
                    >
                      Nama Depan
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-[7px] border-[1.5px] border-stroke bg-white py-2.5 pl-4 pr-4.5 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder="Nama Depan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nama Belakang */}
                  <div className="w-full sm:w-1/2">
                    <label
                      className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                      htmlFor="lastName"
                    >
                      Nama Belakang
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-[7px] border-[1.5px] border-stroke bg-white py-2.5 pl-4 pr-4.5 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder="Nama Belakang"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Nomor Telepon */}
                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                    htmlFor="phone"
                  >
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-[7px] border-[1.5px] border-stroke bg-white py-2.5 pl-4 pr-4.5 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder="Nomor Telepon"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Nomor Registrasi */}
                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                    htmlFor="noReg"
                  >
                    Nomor Registrasi
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-[7px] border-[1.5px] border-stroke bg-white py-2.5 pl-4 pr-4.5 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="noReg"
                      id="noReg"
                      placeholder="Nomor Registrasi"
                      value={noReg}
                      onChange={(e) => setNoReg(e.target.value)}
                    />
                  </div>
                </div>

                {/* Alamat Email (Hanya Baca) */}
                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                    htmlFor="email"
                  >
                    Alamat Email
                  </label>
                  <div className="relative">
                    <input
                      className="w-full cursor-not-allowed rounded-[7px] border-[1.5px] border-stroke bg-gray-200 py-2.5 pl-4 pr-4.5 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Alamat Email"
                      value={email}
                      readOnly
                    />
                  </div>
                </div>

                {/* Tombol Submit */}
                <div className="flex justify-end gap-3">
                  <button
                    className="flex justify-center rounded-[7px] border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                    type="button"
                    onClick={() => {
                      // Reset form atau tindakan lain jika diperlukan
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="flex justify-center rounded-[7px] bg-primary px-6 py-[7px] font-medium text-white hover:bg-opacity-90"
                    type="submit"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bagian Foto Pengguna */}
        <div className="xl:col-span-2">
          <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
              <h3 className="font-medium text-dark dark:text-white">
                Foto Anda
              </h3>
            </div>
            <div className="p-7">
              {/* Modal Konfirmasi Hapus */}
              {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="rounded-md bg-white p-6 shadow-md dark:bg-gray-dark">
                    <h2 className="mb-4 text-lg font-semibold">
                      Konfirmasi Penghapusan
                    </h2>
                    <p className="mb-6">
                      Apakah Anda yakin ingin menghapus foto profil Anda?
                    </p>
                    <div className="flex justify-end">
                      <button
                        className="mr-4 rounded-md bg-gray-200 px-4 py-2 dark:bg-gray-500"
                        onClick={handleModalCancel}
                      >
                        Batal
                      </button>
                      <button
                        className="rounded-md bg-red-500 px-4 py-2 text-white"
                        onClick={confirmDelete}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Crop */}
              {showCropModal && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="rounded-md bg-white p-6 shadow-md dark:bg-gray-7">
                    <div className="relative h-96 w-96">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    {/* Slider Zoom */}
                    <div className="mt-4">
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    {/* Tombol */}
                    <div className="mt-4 flex justify-end">
                      <button
                        className="mr-4 rounded-md bg-gray-200 px-4 py-2 dark:bg-gray-6"
                        onClick={handleCropCancel}
                      >
                        Batal
                      </button>
                      <button
                        className="rounded-md bg-primary px-4 py-2 text-white"
                        onClick={handleCropConfirm}
                      >
                        Crop
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="h-14 w-14 rounded-full">
                  <Image
                    src={picture}
                    width={55}
                    height={55}
                    alt="User"
                    className="overflow-hidden rounded-full"
                  />
                </div>
                <div>
                  <span className="mb-1.5 font-medium text-dark dark:text-white">
                    Edit foto Anda
                  </span>
                  <span className="flex gap-3">
                    <button
                      className="text-body-sm hover:text-red"
                      onClick={handleDeleteClick}
                    >
                      Hapus
                    </button>
                    <label
                      htmlFor="profilePhoto"
                      className="cursor-pointer text-body-sm hover:text-primary"
                    >
                      Perbarui
                    </label>
                  </span>
                </div>
              </div>

              <div
                id="FileUpload"
                className={`relative mb-5.5 block w-full cursor-pointer appearance-none rounded-xl border ${
                  isDragging
                    ? "scale-105 transform border-primary bg-blue-100"
                    : "border-dashed border-gray-4 bg-gray-2 hover:border-primary"
                } transition-all duration-300 dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  name="profilePhoto"
                  id="profilePhoto"
                  accept="image/png, image/jpg, image/jpeg"
                  className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center justify-center">
                  <span className="flex h-13.5 w-13.5 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
                    <CgProfile style={{ fontSize: "24px" }} />
                  </span>
                  <p className="mt-2.5 text-body-sm font-medium">
                    <span className="text-primary">Klik untuk mengunggah</span>{" "}
                    atau seret dan jatuhkan
                  </p>
                  <p className="mt-1 text-body-xs">
                    SVG, PNG, JPG atau GIF (maks, 800 X 800px)
                  </p>
                </div>
              </div>

              {/* Tombol Simpan tidak diperlukan lagi karena upload terjadi setelah cropping */}
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Sesi Aktif */}
      <div className="mt-8">
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
            <h3 className="font-medium text-dark dark:text-white">
              Daftar Sesi Aktif
            </h3>
          </div>
          <div className="overflow-x-auto p-7">
            <table className="min-w-full divide-y divide-stroke">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Perangkat</th>
                  <th className="px-4 py-2 text-left">IP</th>
                  <th className="px-4 py-2 text-left">Wilayah</th>
                  <th className="px-4 py-2 text-left">Kota</th>
                  <th className="px-4 py-2 text-left">Status</th>{" "}
                  {/* Tambahkan kolom Status */}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        setShowSessionModal(true);
                      }}
                      className="cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-2"
                    >
                      <td className="whitespace-nowrap px-4 py-2">
                        {session.device}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {session.ip}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {session.region}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {session.city}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`rounded px-1 text-xs ${
                            getSessionStatus(session.lastAccessedAt) ===
                            "Online"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {getSessionStatus(session.lastAccessedAt)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5} // Ubah colspan menjadi 5 karena ada kolom Status
                      className="px-4 py-2 text-center"
                    >
                      Tidak ada sesi aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Sesi */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-md dark:bg-gray-dark">
            <h2 className="mb-4 text-lg font-semibold">Detail Sesi</h2>
            <div className="mb-4">
              <p>
                <strong>Perangkat:</strong> {selectedSession.device}
              </p>
              <p>
                <strong>IP:</strong> {selectedSession.ip}
              </p>
              <p>
                <strong>Wilayah:</strong> {selectedSession.region}
              </p>
              <p>
                <strong>Kota:</strong> {selectedSession.city}
              </p>
              <p>
                <strong>Organisasi:</strong> {selectedSession.org}
              </p>
              <p>
                <strong>Zona Waktu:</strong> {selectedSession.timezone}
              </p>
              <p>
                <strong>Dibuat Pada:</strong>{" "}
                {new Date(selectedSession.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Kedaluwarsa Pada:</strong>{" "}
                {new Date(selectedSession.expiredAt).toLocaleString()}
              </p>
              <p>
                <strong>Terakhir Diakses:</strong>{" "}
                {new Date(selectedSession.lastAccessedAt).toLocaleString()}{" "}
                <span
                  className={`rounded px-1 text-xs ${
                    getSessionStatus(selectedSession.lastAccessedAt) ===
                    "Online"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {getSessionStatus(selectedSession.lastAccessedAt)}
                </span>
              </p>
            </div>
            {/* Peta */}
            {selectedSession.loc && (
              <div className="mt-4">
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps?q=${selectedSession.loc}&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            )}
            {/* Tombol Logout/Hapus Sesi */}
            <div className="mt-4 flex justify-between">
              {/* Tombol Tutup */}
              <button
                className="rounded-md bg-primary px-4 py-2 text-white"
                onClick={() => setShowSessionModal(false)}
              >
                Tutup
              </button>
              {/* Tombol Logout/Hapus Sesi */}
              {selectedSession.id !== sessionNow && (
                <button
                  className="rounded-md bg-red-500 px-4 py-2 text-white"
                  onClick={() => handleRemoteLogout(selectedSession)}
                >
                  Logout Sesi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout Sesi */}
      {showConfirmLogoutModal && sessionToLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-md dark:bg-gray-dark">
            <h2 className="mb-4 text-lg font-semibold">
              Konfirmasi Logout Sesi
            </h2>
            <p className="mb-6">
              Apakah Anda yakin ingin logout dari sesi{" "}
              <strong>{sessionToLogout.device}</strong>?
            </p>
            <div className="flex justify-end">
              <button
                className="mr-4 rounded-md bg-gray-200 px-4 py-2 dark:bg-gray-500"
                onClick={cancelRemoteLogout}
              >
                Batal
              </button>
              <button
                className="rounded-md bg-red-500 px-4 py-2 text-white"
                onClick={confirmRemoteLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingBoxes;
