// components/CoolerAnimation.tsx
import React from "react";
import { FaFan } from "react-icons/fa";

interface CoolerAnimationProps {
  speed: number; // Kecepatan dalam persentase (0-100)
}

const CoolerAnimation: React.FC<CoolerAnimationProps> = ({ speed }) => {
  // Konversi speed menjadi durasi animasi
  // Semakin tinggi speed, semakin cepat animasi berputar
  const animationDuration = speed > 0 ? `${10 / speed}s` : "paused";

  return (
    <div className="flex items-center justify-center">
      <div
        className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center"
        style={{
          animation: speed > 0 ? `spin ${animationDuration} linear infinite` : "none",
        }}
      >
        {/* Anda dapat mengganti ini dengan gambar atau ikon cooler */}
        <FaFan className="text-gray-800 text-2xl size-20" />
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CoolerAnimation;
