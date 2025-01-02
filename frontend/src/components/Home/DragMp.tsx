// components/DragMp.tsx
"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import Cookies from "js-cookie";
import styles from "./DragMp.module.css";

// Definisikan interface untuk data gambar
interface ImageData {
  id: string;
  name: string;
  noreg: string;
  shift: string;
  path: string;
  x: number; // Posisi X dalam piksel (tidak digunakan)
  y: number; // Posisi Y dalam piksel (tidak digunakan)
  xPercent: number; // Posisi X sebagai persentase (0-100)
  yPercent: number; // Posisi Y sebagai persentase (0-100)
  isActive: boolean;
  createdAt: string;
  updatedAt: string; // Simpan sebagai string dan konversi ke Date saat diperlukan
}

const DragMp: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [userAuth, setUserAuth] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Definisikan ukuran asli background (misalnya 1920x1080 piksel)
  const ORIGINAL_BG_WIDTH = 1920;
  const ORIGINAL_BG_HEIGHT = 1080;

  // Fungsi untuk memperbarui ukuran container
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      setContainerSize({ width, height });
      console.log("Container size updated:", width, height);
    }
  }, []);

  // Fungsi untuk menghubungkan WebSocket dengan mekanisme auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (!userAuth) return;

    const wsUrl = `wss://${process.env.NEXT_PUBLIC_HTTPS_API_URL}/dataHenkaten?token=${userAuth}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      reconnectAttemptsRef.current = 0; // Reset rekoneksi saat berhasil terhubung
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: any[] = JSON.parse(event.data);
        if (Array.isArray(data)) {
          // Menggunakan xPercent dan yPercent langsung
          const activeImages: ImageData[] = data
            .filter((img) => img.isActive)
            .map((img) => ({
              ...img,
              // Pastikan xPercent dan yPercent sudah tersedia
              xPercent: img.xPercent,
              yPercent: img.yPercent,
            }));
          console.log("Images loaded from WebSocket:", activeImages);

          setImages((prevImages) => {
            const updatedImages = [...prevImages];
            activeImages.forEach((newImg) => {
              const existingImgIndex = updatedImages.findIndex(
                (img) => img.id === newImg.id,
              );
              if (existingImgIndex !== -1) {
                const existingImg = updatedImages[existingImgIndex];
                // Bandingkan updatedAt
                if (
                  new Date(newImg.updatedAt) > new Date(existingImg.updatedAt)
                ) {
                  // Hanya perbarui jika updatedAt lebih baru
                  updatedImages[existingImgIndex] = newImg;
                }
              } else {
                // Tambahkan gambar baru jika belum ada
                updatedImages.push(newImg);
              }
            });
            return updatedImages;
          });
        } else {
          console.error("Format data tidak diharapkan:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    ws.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
      // WebSocket akan ditutup dan reconnect akan dilakukan di onclose
    };

    ws.onclose = (event: CloseEvent) => {
      console.log("WebSocket connection closed:", event);
      // Auto-reconnect dengan delay terus-menerus
      const timeout = Math.min(30000, 1000 * 2 ** reconnectAttemptsRef.current); // Max 30 detik
      console.log(`Attempting to reconnect in ${timeout / 1000} seconds...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        connectWebSocket();
      }, timeout);
    };
  }, [userAuth]);

  // Tambahkan event listener untuk resize window
  useEffect(() => {
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => {
      window.removeEventListener("resize", updateContainerSize);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [updateContainerSize]);

  // Ambil userAuth dari cookie saat komponen dimuat
  useEffect(() => {
    const auth = Cookies.get("userAuth");
    if (!auth) {
      console.error("userAuth token tidak ditemukan di cookies.");
      return;
    }
    setUserAuth(auth);
  }, []);

  // Koneksikan WebSocket saat userAuth diperbarui
  useEffect(() => {
    if (userAuth) {
      connectWebSocket();
    }
    // Cleanup saat komponen di-unmount atau userAuth berubah
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userAuth, connectWebSocket]);

  // Fungsi untuk menyimpan posisi baru ke backend
  const savePosition = async (
    id: string,
    xPercent: number,
    yPercent: number,
  ) => {
    try {
      const response = await fetch(
        `https://${process.env.NEXT_PUBLIC_HTTPS_API_URL}/api/manage/henkaten/edit/position`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userAuth}`,
          },
          body: JSON.stringify({ id, xPercent, yPercent }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Position saved:", result);

      // Asumsikan API mengembalikan field updatedAt
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id
            ? { ...img, xPercent, yPercent, updatedAt: result.updatedAt }
            : img,
        ),
      );
    } catch (error) {
      console.error("Error saving position:", error);
    }
  };

  // Handler saat drag
  const handleDrag = useCallback(
    (id: string) => (e: DraggableEvent, data: DraggableData) => {
      if (containerSize.width === 0 || containerSize.height === 0) return;

      // Hitung posisi persentase berdasarkan ukuran kontainer saat ini
      const xPercent = (data.x / containerSize.width) * 100;
      const yPercent = (data.y / containerSize.height) * 100;

      // Update state secara optimistik
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, xPercent, yPercent } : img,
        ),
      );
    },
    [containerSize.width, containerSize.height],
  );

  // Handler saat drag berhenti
  const handleStop = useCallback(
    (id: string) => async (e: DraggableEvent, data: DraggableData) => {
      if (containerSize.width === 0 || containerSize.height === 0) return;

      // Hitung posisi persentase berdasarkan ukuran kontainer saat ini
      const xPercent = (data.x / containerSize.width) * 100;
      const yPercent = (data.y / containerSize.height) * 100;

      console.log(`Image ${id} moved to x: ${xPercent}%, y: ${yPercent}%`);
      await savePosition(id, xPercent, yPercent);
    },
    [containerSize.width, containerSize.height, userAuth],
  );

  // Mendapatkan URL background image dari environment variable
  const backgroundImageUrl = `https://${process.env.NEXT_PUBLIC_HTTPS_API_URL}/files/img/mp/background.jpg`;

  return (
    <div
      className={styles.containerWrapper}
      ref={containerRef}
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: "cover", // Pastikan background mengisi kontainer
        backgroundPosition: "center", // Atur posisi background
      }}
    >
      {/* Render gambar draggable jika ukuran kontainer sudah diketahui */}
      {containerSize.width > 0 &&
        containerSize.height > 0 &&
        images.map((img) => {
          // Hitung posisi absolut berdasarkan persentase
          const posX = (img.xPercent / 100) * containerSize.width;
          const posY = (img.yPercent / 100) * containerSize.height;

          console.log(`Rendering image ${img.id} at x: ${posX}, y: ${posY}`);

          return (
            <Draggable
              key={img.id}
              position={{ x: posX, y: posY }}
              onDrag={handleDrag(img.id)}
              onStop={(e, data) => {
                handleStop(img.id)(e, data);
              }}
              bounds="parent" // Membatasi drag agar tetap di dalam kontainer
            >
              <div className={styles.draggableImageContainer}>
                <div className={styles.draggableImageWrapper}>
                  <Image
                    src={img.path}
                    alt={img.name}
                    className={styles.draggableImage}
                    fill // Menggunakan fill agar image mengisi wrapper
                    draggable={false} // Menghindari konflik dengan draggable
                  />
                </div>
              </div>
            </Draggable>
          );
        })}
    </div>
  );
};

export default DragMp;