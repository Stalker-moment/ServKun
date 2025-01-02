import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableSensor from "@/components/Tables/TableSensor";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Sensor management | ServKun",
  description: "Dashboard for managing sensors",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Sensor" />

      <div className="flex flex-col gap-10">
        <TableSensor />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
