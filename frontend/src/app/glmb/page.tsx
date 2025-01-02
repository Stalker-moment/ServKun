import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import GlmPage from '@/components/Glm/index';
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Next.js Tables Page | NextAdmin - Next.js Dashboard Kit",
  description: "This is Next.js Tables page for NextAdmin Dashboard Kit",
};

const GLMB = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="GL Management Board" />

      <div className="flex flex-col gap-10">
        <GlmPage />
      </div>
    </DefaultLayout>
  );
};

export default GLMB;
