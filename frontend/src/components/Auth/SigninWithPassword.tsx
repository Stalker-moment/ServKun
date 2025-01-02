"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Image from "next/image";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

// Komponen Logo Internal
const Logo = () => (
  <div className="mx-auto mb-6 h-48 w-48 object-contain">
    <Image
      src="/images/logo/servkun_white-removebg.svg" // Logo untuk mode terang
      alt="Server Tierkun Logo"
      width={512}
      height={512}
      className="dark:hidden" // Hanya tampil di mode terang
    />
    <Image
      src="/images/logo/servkun_black-removebg.svg" // Logo untuk mode gelap
      alt="Server Tierkun Logo Dark"
      width={512}
      height={512}
      className="hidden dark:block" // Hanya tampil di mode gelap
    />
  </div>
);

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [theme, setTheme] = useState("light"); // State untuk tema

  // Mengatur state tema berdasarkan cookie saat komponen dimuat
  useEffect(() => {
    const savedTheme = Cookies.get("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Jika tidak ada preferensi yang disimpan, gunakan preferensi sistem
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
        Cookies.set("theme", "dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
        Cookies.set("theme", "light");
      }
    }

    // Mencegah scrolling pada halaman login
    document.body.style.overflow = "hidden";

    // Mengembalikan scroll saat komponen dibongkar
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Handler untuk toggle tema
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      Cookies.set("theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      Cookies.set("theme", "light");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setData({
      ...data,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  interface FormData {
    email: string;
    password: string;
    remember: boolean;
  }

  interface LoginResponse {
    token: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const response = await fetch(`https://${HTTPSAPIURL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (response.ok) {
        const result: LoginResponse = await response.json();
        Cookies.set("userAuth", result.token, { expires: data.remember ? 7 : undefined });
        window.location.href = "/";
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("An error occurred during login.");
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Kolom Kiri: Formulir Login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg box-border">
          {/* Toggle Theme */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleTheme}
              className="flex items-center focus:outline-none transition-colors duration-300"
              aria-label="Toggle Dark Mode"
            >
              {theme === "light" ? (
                // Icon untuk Dark Mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-800 dark:text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m8.66-8.66h-1M4.34 12.34h-1m15.36 6.36l-.707-.707M6.34 6.34l-.707-.707m12.02 0l-.707.707M6.34 17.66l-.707.707M12 5a7 7 0 000 14 7 7 0 000-14z"
                  />
                </svg>
              ) : (
                // Icon untuk Light Mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m8.66-8.66h-1M4.34 12.34h-1m15.36 6.36l-.707-.707M6.34 6.34l-.707-.707m12.02 0l-.707.707M6.34 17.66l-.707.707M12 5a7 7 0 000 14 7 7 0 000-14z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2.5 text-gray-700 dark:text-gray-200 font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2.5 text-gray-700 dark:text-gray-200 font-medium">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-300"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="remember"
                checked={data.remember}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-gray-700 dark:text-gray-200">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Kolom Kanan: Logo dan Teks Sambutan */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-6">
        <div className="text-center">
          {/* Logo Internal */}
          <Logo />

          {/* Teks Sambutan */}
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Welcome Back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to your account to continue.
          </p>
        </div>
      </div>
    </div>
  );
}