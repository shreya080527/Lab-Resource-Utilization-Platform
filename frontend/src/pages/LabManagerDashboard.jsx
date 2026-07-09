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
import RecentEquipment from "../components/equipment/RecentEquipment";

import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorCard from "../components/common/ErrorCard";

export default function LabManagerDashboard() {

    const navigate = useNavigate();

    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (

        <AppLayout
            title="Lab Manager Dashboard"
            role="LAB_MANAGER"
        >

            {/* Quick Actions */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                <button
                    onClick={() => navigate("/equipment")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl hover:scale-105 duration-300"
                >
                    <Package size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Equipment
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/equipment/add")}
                    className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 text-white shadow-xl hover:scale-105 duration-300"
                >
                    <Boxes size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Add Equipment
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/inventory")}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-2xl p-6 text-white shadow-xl hover:scale-105 duration-300"
                >
                    <ClipboardList size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Inventory
                    </h2>
                </button>

                <button
                    onClick={() => navigate("/inventory/add")}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-6 text-white shadow-xl hover:scale-105 duration-300"
                >
                    <Package size={36} className="mb-3" />
                    <h2 className="text-lg font-semibold">
                        Add Inventory
                    </h2>
                </button>

            </div>

            {/* Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

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

            <div className="mt-10">

                <EquipmentStatusChart

                    stats={{
                        availableQuantity: available,
                        reservedQuantity: inUse,
                        maintenanceQuantity: maintenance,
                        retiredQuantity: retired
                    }}

                />

            </div>

            {/* Recent Equipment */}

            <div className="mt-10">

                <RecentEquipment
                    equipment={equipment}
                />

            </div>

        </AppLayout>

    );

}