import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Boxes,
    CheckCircle,
    AlertTriangle,
    Wrench,
    ClipboardList
} from "lucide-react";

import { getAllEquipment } from "../services/equipmentService";

import AppLayout from "../components/equipment/AppLayout";
import StatCard from "../components/equipment/StatCard";
import EquipmentStatusChart from "../components/equipment/EquipmentStatusChart";
import RecentActivity from "../components/equipment/RecentActivity";
import RecentEquipment from "../components/equipment/RecentEquipment";
import DashboardHeader from "../components/equipment/DashboardHeader";


import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorCard from "../components/common/ErrorCard";

export default function LabManagerDashboard() {

    const navigate = useNavigate();

    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // NEW
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        loadEquipment();
    }, []);

    async function loadEquipment() {

        try {

            setLoading(true);
            setError("");

            const response = await getAllEquipment();

            setEquipment(response.data || []);

        } catch (err) {

            console.log(err);

            setError("Unable to load dashboard.");

        } finally {

            setLoading(false);

        }

    }

    if (loading) {
        return <LoadingSpinner text="Loading Dashboard..." />;
    }

    if (error) {
        return (
            <ErrorCard
                message={error}
                onRetry={loadEquipment}
            />
        );
    }

    // ================= Statistics =================

    const totalEquipment = equipment.length;

    const available = equipment.filter(
        item => item.status === "AVAILABLE"
    ).length;

    const inUse = equipment.filter(
        item => item.status === "IN_USE"
    ).length;

    const maintenance = equipment.filter(
        item => item.status === "MAINTENANCE"
    ).length;

    const retired = equipment.filter(
        item => item.status === "RETIRED"
    ).length;

    // ================= Filter =================

    const filteredEquipment = equipment.filter((item) => {

        const matchesSearch =
            item.equipmentName
                ?.toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" ||
            item.status === statusFilter;

        return matchesSearch && matchesStatus;

    });

    return (

        <AppLayout
            title="Lab Manager Dashboard"
            role="LAB_MANAGER"
        >

            <DashboardHeader />

                <div className="mb-8"></div>

            {/* Search & Filter */}

            <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div className="flex-1">

                        <input
                            type="text"
                            placeholder="🔍 Search equipment by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />

                    </div>

                    <div className="text-gray-500">

                        Showing

                        <span className="mx-2 font-bold text-cyan-600">

                            {filteredEquipment.length}

                        </span>

                        Equipment

                    </div>

                </div>

                <div className="flex flex-wrap gap-3 mt-6">

                    <button
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-5 py-2 rounded-full transition ${statusFilter === "ALL"
                                ? "bg-blue-600 text-white"
                                : "border hover:bg-blue-50"
                            }`}
                    >
                        All
                    </button>

                    <button
                        onClick={() => setStatusFilter("AVAILABLE")}
                        className={`px-5 py-2 rounded-full transition ${statusFilter === "AVAILABLE"
                                ? "bg-green-600 text-white"
                                : "border hover:bg-green-50"
                            }`}
                    >
                        Available
                    </button>

                    <button
                        onClick={() => setStatusFilter("IN_USE")}
                        className={`px-5 py-2 rounded-full transition ${statusFilter === "IN_USE"
                                ? "bg-yellow-500 text-white"
                                : "border hover:bg-yellow-50"
                            }`}
                    >
                        In Use
                    </button>

                    <button
                        onClick={() => setStatusFilter("MAINTENANCE")}
                        className={`px-5 py-2 rounded-full transition ${statusFilter === "MAINTENANCE"
                                ? "bg-red-500 text-white"
                                : "border hover:bg-red-50"
                            }`}
                    >
                        Maintenance
                    </button>

                    <button
                        onClick={() => setStatusFilter("RETIRED")}
                        className={`px-5 py-2 rounded-full transition ${statusFilter === "RETIRED"
                                ? "bg-gray-700 text-white"
                                : "border hover:bg-gray-50"
                            }`}
                    >
                        Retired
                    </button>

                </div>

            </div>

            {/* Quick Actions */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                <button
                    onClick={() => navigate("/equipment")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-7 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                    <Package size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Equipment
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/equipment/add")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-7 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                    <Boxes size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Add Equipment
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/inventory")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-7 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                    <ClipboardList size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Inventory
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/inventory/add")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-7 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                    <Package size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Add Inventory
                    </h2>
                </button>

            </div>

            {/* Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">

                <StatCard
                    title="Total Equipment"
                    value={totalEquipment}
                    color="bg-gradient-to-r from-blue-600 to-cyan-500"
                    icon={<Package size={40} />}
                />

                <StatCard
                    title="Available"
                    value={available}
                    color="bg-gradient-to-r from-green-600 to-emerald-500"
                    icon={<CheckCircle size={40} />}
                />

                <StatCard
                    title="In Use"
                    value={inUse}
                    color="bg-gradient-to-r from-yellow-500 to-orange-500"
                    icon={<AlertTriangle size={40} />}
                />

                <StatCard
                    title="Maintenance"
                    value={maintenance}
                    color="bg-gradient-to-r from-red-600 to-pink-500"
                    icon={<Wrench size={40} />}
                />

                <StatCard
                    title="Retired"
                    value={retired}
                    color="bg-gradient-to-r from-gray-600 to-gray-800"
                    icon={<Boxes size={40} />}
                />

                <StatCard
                    title="Active Equipment"
                    value={available + inUse + maintenance}
                    color="bg-gradient-to-r from-indigo-600 to-violet-500"
                    icon={<ClipboardList size={40} />}
                />

            </div>

            {/* Chart */}

            <div className="mt-12">

                <EquipmentStatusChart

                    stats={{
                        availableQuantity: available,
                        reservedQuantity: inUse,
                        maintenanceQuantity: maintenance,
                        retiredQuantity: retired
                    }}

                />

            </div>

            {/* Dashboard Bottom Section */}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-12">
                {/* Recent Equipment */}

                <div className="xl:col-span-2">

                    <RecentEquipment
                        equipment={filteredEquipment}
                    />

                </div>

                {/* Recent Activity */}

                <div>

                    <RecentActivity
            equipment={equipment}
        />

                </div>

            </div>
        </AppLayout>

    );

}