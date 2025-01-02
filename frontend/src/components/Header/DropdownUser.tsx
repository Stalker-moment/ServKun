// components/DropdownUser.tsx
import { useState, useEffect, useRef } from "react"; 
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/ClickOutside";
import Cookies from "js-cookie";
import {
  MdOutlineManageAccounts,
  MdAccountCircle,
  MdOutlineLogout,
} from "react-icons/md";
import Notification from "./notification";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

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

interface UserInfoResponse {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
}

const DropdownUser: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [user, setUser] = useState<Contact | null>(null); // State untuk menyimpan data pengguna
  const [loading, setLoading] = useState<boolean>(true); // State untuk menangani loading
  const [error, setError] = useState<string | null>(null); // State untuk menangani error
  const ws = useRef<WebSocket | null>(null); // Ref untuk menyimpan instance WebSocket
  const [shouldReconnect, setShouldReconnect] = useState<boolean>(true); // Kontrol untuk reconnect
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0); // Jumlah percobaan reconnect (opsional)
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  const handleLogout = async () => {
    const token = Cookies.get("userAuth");
    if (!token) {
      window.location.href = "/auth/signin";
      return;
    }

    try {
      // Request ke API untuk logout
      const response = await fetch(`https://${HTTPSAPIURL}/api/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Menambahkan token ke header
        },
        body: JSON.stringify({
          token: token,
        })
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status: ${response.status}`);
      }

      // Hapus semua cookie
      Object.keys(Cookies.get()).forEach(function(cookieName) {
        Cookies.remove(cookieName);
      });

      // Redirect ke halaman login
      window.location.href = "/auth/signin";
    } catch (err: any) {
      console.error("Logout failed:", err);
      setError(err.message || "Logout failed");
      // Anda bisa menambahkan notifikasi error di sini
    }
  };

  const fetchUserInfo = async () => {
    const token = Cookies.get("userAuth");
    if (!token) {
      // Jika token tidak ada, redirect ke login
      window.location.href = "/auth/signin";
      return;
    }

    try {
      const response = await fetch(`https://${HTTPSAPIURL}/api/users/token/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Menambahkan token ke header
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: UserInfoResponse = await response.json();
      setUser(data.contact); // Menyimpan data contact ke state user
    } catch (err: any) {
      console.error("Failed to fetch user info:", err);
      setError(err.message || "Failed to fetch user info");
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const token = Cookies.get("userAuth");
    if (!token) {
      window.location.href = "/auth/signin";
      return;
    }

    const wsUrl = `wss://${HTTPSAPIURL}/dataSessionId?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connection opened");
      setReconnectAttempts(0); // Reset jumlah percobaan reconnect
    };

    ws.current.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);

      if (event.data === "{\"error\":\"Invalid session\"}") {
        setShouldReconnect(false); // Stop attempting to reconnect
        showNotification("Session Expired, please login again", "error");
        handleLogout();
      } else {
        // Tangani data yang valid di sini
        console.log("Valid session data:", event.data);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket connection closed", event);

      if (shouldReconnect) {
        // Delay sebelum mencoba reconnect
        const reconnectDelay = 5000; // 5 detik, bisa disesuaikan
        console.log(`Attempting to reconnect in ${reconnectDelay / 1000} seconds...`);

        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connectWebSocket();
        }, reconnectDelay);
      }
    };
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    connectWebSocket();

    // Fungsi cleanup
    return () => {
      setShouldReconnect(false); // Mencegah reconnect saat komponen di-unmount
      if (ws.current) {
        ws.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="relative">
        {/* Anda bisa mengganti ini dengan spinner/loading indicator */}
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        {/* Tampilkan pesan error atau fallback UI */}
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
      >
        <span className="h-12 w-12 rounded-full">
          <Image
            width={48}
            height={48}
            src={user?.picture || "/images/user/user-03.png"} // Menggunakan foto dari API atau default
            alt="User"
            className="overflow-hidden rounded-full"
          />
        </span>

        <span className="flex items-center gap-2 font-medium text-dark dark:text-dark-6">
          <span className="hidden lg:block">
            {user ? `${user.firstName} ${user.lastName}` : "User"} {/* Menampilkan nama dari API */}
          </span>

          <svg
            className={`fill-current duration-200 ease-in ${dropdownOpen ? "rotate-180" : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.6921 7.09327C3.91674 6.83119 4.3113 6.80084 4.57338 7.02548L9.99997 11.6768L15.4266 7.02548C15.6886 6.80084 16.0832 6.83119 16.3078 7.09327C16.5325 7.35535 16.5021 7.74991 16.24 7.97455L10.4067 12.9745C10.1727 13.1752 9.82728 13.1752 9.59322 12.9745L3.75989 7.97455C3.49781 7.74991 3.46746 7.35535 3.6921 7.09327Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </button>

      {/* <!-- Dropdown Start --> */}
      {dropdownOpen && (
        <div
          className={`absolute right-0 mt-7.5 flex w-[280px] flex-col rounded-lg border-[0.5px] border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark`}
        >
          <div className="flex items-center gap-2.5 px-5 pb-5.5 pt-3.5">
            <span className="relative block h-12 w-12 rounded-full">
              <Image
                width={48}
                height={48}
                src={user?.picture || "/images/user/user-03.png"} // Menggunakan foto dari API atau default
                alt="User"
                className="overflow-hidden rounded-full"
              />

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green dark:border-gray-dark"></span>
            </span>

            <span className="block">
              <span className="block font-medium text-dark dark:text-white">
                {user ? `${user.firstName} ${user.lastName}` : "User"} {/* Menampilkan nama dari API */}
              </span>
              <span className="block font-medium text-dark-5 dark:text-dark-6">
                {user?.email || "email@example.com"} {/* Menampilkan email dari API */}
              </span>
            </span>
          </div>
          <ul className="flex flex-col gap-1 border-y-[0.5px] border-stroke p-2.5 dark:border-dark-3">
            <li>
              <Link
                href="/profile"
                className="flex w-full items-center gap-2.5 rounded-[7px] p-2.5 text-sm font-medium text-dark-4 duration-300 ease-in-out hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white lg:text-base"
              >
                <MdAccountCircle className="fill-current w-5 h-5" />
                View Profile
              </Link>
            </li>

            <li>
              <Link
                href="/pages/settings"
                className="flex w-full items-center gap-2.5 rounded-[7px] p-2.5 text-sm font-medium text-dark-4 duration-300 ease-in-out hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white lg:text-base"
              >
                <MdOutlineManageAccounts className="fill-current w-5 h-5" />
                Account Settings
              </Link>
            </li>
          </ul>
          <div className="p-2.5">
            <button
              className="flex w-full items-center gap-2.5 rounded-[7px] p-2.5 text-sm font-medium text-dark-4 duration-300 ease-in-out hover:bg-red-500 hover:text-dark dark:text-dark-6 dark:hover:bg-red-500 dark:hover:text-white lg:text-base"
              onClick={handleLogout}
            >
              <MdOutlineLogout className="fill-current w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
      {/* <!-- Dropdown End --> */}
    </ClickOutside>
  );
};

export default DropdownUser;