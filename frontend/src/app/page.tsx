import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import 'leaflet/dist/leaflet.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import DragMp from '@/components/Home/DragMp';

export const metadata: Metadata = {
  title:
    "Dashboard | Monitoring Server Tierkun",
  description: "Monitoring Server Tierkun",
  icons: "/images/logo/servkun_black-removebg.svg",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <DragMp />
      </DefaultLayout>
    </>
  );
}
