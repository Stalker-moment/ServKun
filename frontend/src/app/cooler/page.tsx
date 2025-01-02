import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableCooler from "@/components/Tables/TableCooler";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Cooler management | ServKun",
  description: "Dashboard for managing coolers",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Cooler" />

      <div className="flex flex-col gap-10">
        <TableCooler />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
