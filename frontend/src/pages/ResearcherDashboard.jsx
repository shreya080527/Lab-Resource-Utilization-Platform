import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Clock3,
    CheckCircle2,
    Hourglass
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { getResearcherDashboard } from "../services/BookingService";
import { getUserDetails } from "../services/authService";
import { useAuth } from "../services/context/useauth";

export default function ResearcherDashboard() {

    const navigate = useNavigate();

    const { logout } = useAuth();

    const role = localStorage.getItem("role");

    const [loading, setLoading] = useState(true);

    const [dashboard, setDashboard] = useState({
        bookings: [],
        waitlistEntries: [],
    });

    useEffect(() => {

        if (role !== "RESEARCHER") {
            navigate("/login");
            return;
        }

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const user = await getUserDetails();

            const response = await getResearcherDashboard(user.data.id);

            setDashboard(response.data);

        } catch (e) {

            console.log(e);

        } finally {

            setLoading(false);

        }

    };

    const handleLogout = () => {

        const confirmLogout = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) return;

        logout();

        localStorage.removeItem("role");

        toast.success("Logged out successfully 👋", {
            duration: 1200,
        });

        setTimeout(() => {
            navigate("/login");
        }, 1200);

    };

    const totalBookings = dashboard.bookings.length;

    const pendingBookings = dashboard.bookings.filter(
        booking => booking.status === "PENDING"
    ).length;

    const confirmedBookings = dashboard.bookings.filter(
        booking => booking.status === "CONFIRMED"
    ).length;

    const waitlistCount = dashboard.waitlistEntries.length;

    if (loading) {

        return (

            <div className="flex justify-center items-center h-screen">

                <h2 className="text-2xl font-bold">
                    Loading Dashboard...
                </h2>

            </div>

        );

    }

    return (

        <>
            <Toaster position="top-right" />

            <div className="p-8 bg-slate-100 min-h-screen">

                {/* Header */}

                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-4xl font-bold">

                        Researcher Dashboard

                    </h1>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-lg transition duration-300"
                    >
                        Logout
                    </button>

                </div>

                {/* Statistics */}

                <div className="grid md:grid-cols-4 gap-6 mb-8">

                    <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">

                        <CalendarDays
                            className="text-blue-600 mb-3"
                            size={35}
                        />

                        <h3 className="text-gray-500">
                            Total Bookings
                        </h3>

                        <h1 className="text-4xl font-bold">
                            {totalBookings}
                        </h1>

                    </div>

                    <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">

                        <Clock3
                            className="text-orange-500 mb-3"
                            size={35}
                        />

                        <h3 className="text-gray-500">
                            Pending
                        </h3>

                        <h1 className="text-4xl font-bold">
                            {pendingBookings}
                        </h1>

                    </div>

                    <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">

                        <CheckCircle2
                            className="text-green-600 mb-3"
                            size={35}
                        />

                        <h3 className="text-gray-500">
                            Confirmed
                        </h3>

                        <h1 className="text-4xl font-bold">
                            {confirmedBookings}
                        </h1>

                    </div>

                    <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">

                        <Hourglass
                            className="text-purple-600 mb-3"
                            size={35}
                        />

                        <h3 className="text-gray-500">
                            Waitlist
                        </h3>

                        <h1 className="text-4xl font-bold">
                            {waitlistCount}
                        </h1>

                    </div>

                </div>

                {/* Recent Bookings */}

                <div className="bg-white rounded-xl shadow p-6">

                    <h2 className="text-2xl font-bold mb-6">

                        Recent Bookings

                    </h2>

                    {

                        dashboard.bookings.length === 0 ?

                            (

                                <p className="text-gray-500">

                                    No bookings found.

                                </p>

                            )

                            :

                            (

                                <table className="w-full">

                                    <thead>

                                        <tr className="border-b">

                                            <th className="text-left py-3">
                                                Equipment
                                            </th>

                                            <th className="text-left">
                                                Start
                                            </th>

                                            <th className="text-left">
                                                End
                                            </th>

                                            <th className="text-left">
                                                Status
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {

                                            dashboard.bookings.map((booking) => (

                                                <tr
                                                    key={booking.id}
                                                    className="border-b hover:bg-gray-50"
                                                >

                                                    <td className="py-4">

                                                        {
                                                            booking.equipment?.equipmentName ||
                                                            booking.equipment?.name ||
                                                            "Equipment"
                                                        }

                                                    </td>

                                                    <td>

                                                        {booking.startTime}

                                                    </td>

                                                    <td>

                                                        {booking.endTime}

                                                    </td>

                                                    <td>

                                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">

                                                            {booking.status}

                                                        </span>

                                                    </td>

                                                </tr>

                                            ))

                                        }

                                    </tbody>

                                </table>

                            )

                    }

                </div>

            </div>

        </>

    );

}