import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LabManagerDashboard from "./pages/LabManagerDashboard";
import ResearcherDashboard from "./pages/ResearcherDashboard";

import Equipment from "./pages/Equipment";
import AddEquipment from "./pages/AddEquipment";
import EditEquipment from "./pages/EditEquipment";

import Inventory from "./pages/Inventory";
import AddInventory from "./pages/AddInventory";

import MyBookings from "./pages/MyBookings";
import BookingCalendar from "./pages/BookingCalendar";
import BookEquipment from "./pages/BookEquipment";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Authentication */}

                <Route path="/" element={<Homepage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/signup" element={<SignupPage />} />

                <Route path="/verify-otp" element={<VerifyOtpPage />} />

                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ================= Lab Manager ================= */}

                <Route
                    path="/lab-manager/dashboard"
                    element={<LabManagerDashboard />}
                />

                {/* ================= Equipment ================= */}

                <Route
                    path="/equipment"
                    element={<Equipment />}
                />

                <Route
                    path="/equipment/add"
                    element={<AddEquipment />}
                />

                <Route
                    path="/equipment/edit/:id"
                    element={<EditEquipment />}
                />

                {/* ================= Inventory ================= */}

                <Route
                    path="/inventory"
                    element={<Inventory />}
                />

                <Route
                    path="/inventory/add"
                    element={<AddInventory />}
                />

                {/* ================= Researcher ================= */}

                <Route
                    path="/researcher-dashboard"
                    element={<ResearcherDashboard />}
                />

                <Route
                    path="/researcher/bookings"
                    element={<MyBookings />}
                />

                <Route
                    path="/researcher/calendar"
                    element={<BookingCalendar />}
                />

                <Route
                    path="/researcher/book-equipment"
                    element={<BookEquipment />}
                />

                {/* ================= Department Head ================= */}

                <Route
                    path="/department-head/dashboard"
                    element={
                        <div className="p-10 text-4xl font-bold">
                            Department Head Dashboard (Coming Soon)
                        </div>
                    }
                />

                {/* ================= Technician ================= */}

                <Route
                    path="/technician/dashboard"
                    element={
                        <div className="p-10 text-4xl font-bold">
                            Lab Technician Dashboard (Coming Soon)
                        </div>
                    }
                />

                {/* ================= System Admin ================= */}

                <Route
                    path="/system-admin/dashboard"
                    element={
                        <div className="p-10 text-4xl font-bold">
                            System Admin Dashboard (Coming Soon)
                        </div>
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}

export default App;