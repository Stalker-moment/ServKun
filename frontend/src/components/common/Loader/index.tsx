// components/Loader.tsx
"use client"; // Jika Anda menggunakan Next.js 13 dengan App Directory

import Image from "next/image";

const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-dark relative">
      {/* Spinner */}
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      
      {/* Logo dengan Animasi Scaling */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/images/logo/onlytoyota.svg"
          alt="Only Toyota Logo"
          width={40} // Sesuaikan ukuran sesuai kebutuhan
          height={40} // Sesuaikan ukuran sesuai kebutuhan
          className="animate-scale-pulse"
        />
      </div>
    </div>
  );
};

export default Loader;