import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { setSelectedPgId } from "@/lib/api";

import ProtectedRoute from "@/components/ProtectedRoute";
import DemoHome from "@/components/DemoHome";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PgList from "./pages/PgList";
import FloorDetail from "./pages/FloorDetail";
import FloorEdit from "./pages/FloorEdit";
import RoomDetail from "./pages/RoomDetail";
import StudentDetail from "./pages/StudentDetail";
import VacantRooms from "./pages/VacantRooms";
import Residents from "./pages/Residents";
import FoodMenu from "./pages/FoodMenu";
import Workers from "./pages/Workers";
import RoomSetup from "./pages/RoomSetup";
import StudentsPage from "./pages/StudentsPage";
import RoomsPage from "./pages/RoomsPage";
import BedsPage from "./pages/BedsPage";
import MonthlyStatusPage from "./pages/MonthlyStatusPage";
import WorkersPage from "./pages/WorkersPage";
import MenuPage from "./pages/MenuPage";
import SuperAdminPgs from "./pages/SuperAdminPgs";
import OwnerDetails from "./pages/OwnerDetails";
import CreatePg from "./pages/CreatePg";
import EditPg from "./pages/EditPg";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

function PgScope({ children }: { children: React.ReactNode }) {
  const { pgId } = useParams();

  useEffect(() => {
    if (pgId) setSelectedPgId(pgId);
  }, [pgId]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/demo" element={<DemoHome />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin/pgs"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <SuperAdminPgs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owners/:ownerId"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <OwnerDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owners/:ownerId/pgs/create"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <CreatePg />
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin/pgs/:pgId/edit"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <EditPg />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/pgs"
              element={
                <ProtectedRoute roles={["OWNER"]}>
                  <PgList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <Dashboard />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/dashboard"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <Dashboard />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/setup"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <PgScope>
                    <RoomSetup />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/floor/:floorNo/edit"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN"]}>
                  <PgScope>
                    <FloorEdit />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/floor/:floorId"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <FloorDetail />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/room/:roomId"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <RoomDetail />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/student/:studentId"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <StudentDetail />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/vacant-rooms"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <VacantRooms />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/residents"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <Residents />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/food-menu"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <FoodMenu />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/workers-view"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <Workers />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/students"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <StudentsPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/rooms"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                  <PgScope>
                    <RoomsPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/beds"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                  <PgScope>
                    <BedsPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/beds/available"
              element={
                <ProtectedRoute>
                  <PgScope>
                    <BedsPage availableOnly />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/monthly-status"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                  <PgScope>
                    <MonthlyStatusPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/workers"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "WARDEN"]}>
                  <PgScope>
                    <WorkersPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pg/:pgId/menu"
              element={
                <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "WARDEN"]}>
                  <PgScope>
                    <MenuPage />
                  </PgScope>
                </ProtectedRoute>
              }
            />

            <Route
              path="/floor/:floorId"
              element={
                <ProtectedRoute>
                  <FloorDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/room/:roomId"
              element={
                <ProtectedRoute>
                  <RoomDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/:studentId"
              element={
                <ProtectedRoute>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vacant-rooms"
              element={
                <ProtectedRoute>
                  <VacantRooms />
                </ProtectedRoute>
              }
            />

            <Route
              path="/residents"
              element={
                <ProtectedRoute>
                  <Residents />
                </ProtectedRoute>
              }
            />

            <Route
              path="/food-menu"
              element={
                <ProtectedRoute>
                  <FoodMenu />
                </ProtectedRoute>
              }
            />

            <Route
              path="/workers"
              element={
                <ProtectedRoute>
                  <Workers />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;