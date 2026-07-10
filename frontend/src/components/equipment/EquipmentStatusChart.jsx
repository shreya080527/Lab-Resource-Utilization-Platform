import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

import {
    Package,
    CheckCircle,
    Wrench,
    AlertTriangle
} from "lucide-react";

const COLORS = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#6b7280"
];

export default function EquipmentStatusChart({ stats }) {

    const data = [

        {
            name: "Available",
            value: stats.availableQuantity || 0
        },

        {
            name: "In Use",
            value: stats.reservedQuantity || 0
        },

        {
            name: "Maintenance",
            value: stats.maintenanceQuantity || 0
        },

        {
            name: "Retired",
            value: stats.retiredQuantity || 0
        }

    ];

    const total =
        data.reduce((sum, item) => sum + item.value, 0);

    return (

        <div className="grid lg:grid-cols-2 gap-8">

            {/* Chart */}

            <div className="bg-white rounded-3xl shadow-xl p-6">

                <h2 className="text-2xl font-bold mb-6">

                    Equipment Status

                </h2>

                <ResponsiveContainer
                    width="100%"
                    height={340}
                >

                    <PieChart>

                        <Pie
                            data={data}
                            dataKey="value"
                            outerRadius={120}
                            label
                        >

                            {

                                data.map((entry, index) => (

                                    <Cell
                                        key={index}
                                        fill={COLORS[index]}
                                    />

                                ))

                            }

                        </Pie>

                        <Tooltip />

                        <Legend />

                    </PieChart>

                </ResponsiveContainer>

            </div>

            {/* Dashboard Summary */}

            <div className="bg-white rounded-3xl shadow-xl p-8">

                <h2 className="text-2xl font-bold mb-8">

                    Dashboard Summary

                </h2>

                <div className="space-y-6">

                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-3">

                            <Package
                                className="text-blue-600"
                                size={28}
                            />

                            <span>Total Equipment</span>

                        </div>

                        <span className="font-bold text-xl">

                            {total}

                        </span>

                    </div>

                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-3">

                            <CheckCircle
                                className="text-green-600"
                                size={28}
                            />

                            <span>Available</span>

                        </div>

                        <span className="font-bold text-green-600 text-xl">

                            {stats.availableQuantity}

                        </span>

                    </div>

                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-3">

                            <Wrench
                                className="text-red-600"
                                size={28}
                            />

                            <span>Maintenance</span>

                        </div>

                        <span className="font-bold text-red-600 text-xl">

                            {stats.maintenanceQuantity}

                        </span>

                    </div>

                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-3">

                            <AlertTriangle
                                className="text-yellow-500"
                                size={28}
                            />

                            <span>Attention Required</span>

                        </div>

                        <span className="font-bold text-yellow-500 text-xl">

                            {
                                stats.maintenanceQuantity +
                                stats.retiredQuantity
                            }

                        </span>

                    </div>

                </div>

            </div>

        </div>

    );

}