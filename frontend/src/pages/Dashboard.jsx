import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/DashboardService";

export default function Dashboard() {

    const [stats, setStats] = useState({});

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await getDashboardStats();
            setStats(response.data);
        } catch (e) {
            console.log(e);
        }
    };

    return (

        <div className="p-8">

            <h1 className="text-4xl font-bold mb-8">
                Dashboard
            </h1>

            <div className="grid grid-cols-3 gap-6">

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Total Equipment</h3>
                    <h1 className="text-4xl font-bold">
                        {stats.totalEquipment}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Total Quantity</h3>
                    <h1 className="text-4xl font-bold">
                        {stats.totalQuantity}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Available</h3>
                    <h1 className="text-4xl font-bold text-green-600">
                        {stats.availableQuantity}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Reserved</h3>
                    <h1 className="text-4xl font-bold text-orange-500">
                        {stats.reservedQuantity}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Maintenance</h3>
                    <h1 className="text-4xl font-bold text-red-600">
                        {stats.maintenanceQuantity}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3>Low Stock</h3>
                    <h1 className="text-4xl font-bold">
                        {stats.lowStockCount}
                    </h1>
                </div>

            </div>

        </div>

    );
}