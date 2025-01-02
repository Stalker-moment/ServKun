// Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import { FaObjectGroup } from "react-icons/fa6";
import ClickOutside from "@/components/ClickOutside";
import { PiChalkboardTeacher } from "react-icons/pi";
import { FaClipboardList } from "react-icons/fa";
import { LiaCarCrashSolid } from "react-icons/lia";
import {
  MdOutlineSupervisorAccount,
  MdOutlineDeveloperBoard,
  MdOutlineManageAccounts,
  MdAccountCircle,
  MdOutlineSpaceDashboard,
} from "react-icons/md";
import Cookies from "js-cookie";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuGroups = [
  {
    name: "MAIN MENU",
    menuItems: [
      {
        icon: <MdOutlineSpaceDashboard size={24} />,
        label: "HenkaTen Board",
        route: "/",
        isAdmin: false,
      },
      {
        icon: <MdOutlineDeveloperBoard style={{ fontSize: "24px" }} />,
        label: "SGA Board",
        route: "/sga",
        isAdmin: false,
      },
      {
        icon: <FaObjectGroup style={{ fontSize: "24px" }} />,
        label: "GL Management Board",
        route: "/glmb",
        isAdmin: false,
      },
      {
        icon: <PiChalkboardTeacher style={{ fontSize: "24px" }} />,
        label: "TPM Control Board",
        route: "/tpm", // Pastikan route yang benar
        isAdmin: false,
      },
      {
        icon: <FaClipboardList style={{ fontSize: "24px" }} />,
        label: "Gentani Board",
        route: "/gentani", // Pastikan route yang benar
        isAdmin: false,
      },
      {
        icon: <LiaCarCrashSolid style={{ fontSize: "24px" }} />,
        label: "Defect Operator",
        route: "/defect-operator", // Pastikan route yang benar
        isAdmin: false,
      },
    ],
  },
  {
    name: "OTHERS",
    menuItems: [
      {
        icon: <MdAccountCircle size={24} />,
        label: "Profile",
        route: "/profile",
        isAdmin: false,
      },
      {
        icon: <MdOutlineManageAccounts style={{ fontSize: "24px" }} />,
        label: "Account Settings",
        route: "/pages/settings",
        isAdmin: false, // Item hanya untuk admin
      },
      {
        icon: <MdOutlineSupervisorAccount style={{ fontSize: "24px" }} />,
        label: "Accounts Management",
        route: "/account",
        isAdmin: true, // Item hanya untuk admin
      },
    ],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const authHeader = Cookies.get("userAuth") || "";
        const response = await fetch(
          `https://${HTTPSAPIURL}/api/users/token/info`,
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
          setUserInfo(data);
          if (data.role === "ADMIN") {
            setIsAdmin(true);
          }
        } else {
          console.error("Gagal mengambil informasi pengguna");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden border-r border-stroke bg-white dark:border-stroke-dark dark:bg-gray-dark lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0 duration-300 ease-linear"
            : "-translate-x-full"
        }`}
      >
               {/* <!-- SIDEBAR HEADER --> */}
               <div className="flex flex-col items-center justify-center gap-2 px-6 py-8">
          <Link href="/">
            <Image
              width={128}
              height={128}
              src={"/images/logo/servkun_white-removebg.svg"}
              alt="Logo"
              priority
              className="dark:hidden"
            />
            <Image
              width={128}
              height={128}
              src={"/images/logo/servkun_black-removebg.svg"}
              alt="Logo"
              priority
              className="hidden dark:block"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="block lg:hidden mt-4"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* SVG Path */}
            </svg>
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-1 px-4 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {group.name}
                </h3>

                <ul className="mb-6 flex flex-col gap-2">
                  {group.menuItems
                    .filter((menuItem) => {
                      // Tampilkan item jika tidak memerlukan admin atau pengguna adalah admin
                      return !menuItem.isAdmin || isAdmin;
                    })
                    .map((menuItem, menuIndex) => {
                      // Menentukan apakah menuItem ini aktif
                      const isActive =
                        menuItem.route === "/"
                          ? pathname === menuItem.route
                          : pathname.startsWith(menuItem.route);

                      return (
                        <SidebarItem
                          key={menuIndex}
                          item={menuItem}
                          isActive={isActive}
                        />
                      );
                    })}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
