import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Monitor from "@/components/Tables/Monitor";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Monitoring | ServKun",
  description: "Dashboard for monitoring coolers & sensor",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Cooler" />

      <div className="flex flex-col gap-10">
        <Monitor />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
