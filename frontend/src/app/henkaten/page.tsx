import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DragMp from '@/components/Home/DragMp';
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Next.js Tables Page | NextAdmin - Next.js Dashboard Kit",
  description: "This is Next.js Tables page for NextAdmin Dashboard Kit",
};

const Henkaten = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Henkaten" />

      <div className="flex flex-col gap-10">
        <DragMp />
      </div>
    </DefaultLayout>
  );
};

export default Henkaten;
