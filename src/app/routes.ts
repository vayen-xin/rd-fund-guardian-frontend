import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PersonnelPage } from "./pages/PersonnelPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ProjectListPage } from "./pages/ProjectListPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { MonthlyProjectPage } from "./pages/MonthlyProjectPage";
import { PendingSettlementPage } from "./pages/PendingSettlementPage";
import { OperationLogPage } from "./pages/OperationLogPage";
import { AccountPage } from "./pages/AccountPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "personnel", Component: PersonnelPage },
      { path: "equipment", Component: EquipmentPage },
      { path: "attendance", Component: AttendancePage },
      { path: "projects", Component: ProjectListPage },
      { path: "projects/create", Component: CreateProjectPage },
      { path: "projects/monthly", Component: MonthlyProjectPage },
      { path: "projects/pending-settlement", Component: PendingSettlementPage },
      { path: "operation-log", Component: OperationLogPage },
      { path: "accounts", Component: AccountPage },
    ],
  },
]);