import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableProcess from "@/components/Tables/TableProcess";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Process | ServKun",
  description: "Dashboard for see process",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Process" />

      <div className="flex flex-col gap-10">
        <TableProcess />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
