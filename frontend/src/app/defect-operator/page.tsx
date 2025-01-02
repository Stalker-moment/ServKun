import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Cookies from "js-cookie";
import TableDefect from "@/components/defect-operator/defectop";

export const metadata: Metadata = {
  title: "Next.js Tables Page | NextAdmin - Next.js Dashboard Kit",
  description: "This is Next.js Tables page for NextAdmin Dashboard Kit",
};

const DefectOp = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Defect Operator" />

      <div className="flex flex-col gap-10">
        <TableDefect />
      </div>
    </DefaultLayout>
  );
};

export default DefectOp;
