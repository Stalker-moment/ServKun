import SgaPage from "@/components/SgaBoard/index";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Toyota SGA Board | Triming Digital Board",
  description: "This is Toyota SGA Board for Triming Digital Board",
  icons: "favicon.ico",
};

const SgaBoard: React.FC = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="SGA Board" />

      <SgaPage />
    </DefaultLayout>
  );
};

export default SgaBoard;
