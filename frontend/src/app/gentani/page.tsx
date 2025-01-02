import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import GentaniPage from '@/components/Gentani/index';
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Next.js Tables Page | NextAdmin - Next.js Dashboard Kit",
  description: "This is Next.js Tables page for NextAdmin Dashboard Kit",
};

const Gentani = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Gentani Board" />

      <div className="flex flex-col gap-10">
        <GentaniPage />
      </div>
    </DefaultLayout>
  );
};

export default Gentani;
