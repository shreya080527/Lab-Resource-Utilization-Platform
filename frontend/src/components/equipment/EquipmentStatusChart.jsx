import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const COLORS = [
    "#22c55e", // Available
    "#f59e0b", // In Use
    "#ef4444", // Maintenance
    "#6b7280"  // Retired
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

    return (

        <div className="bg-white rounded-2xl shadow-xl p-6">

            <h2 className="text-2xl font-bold text-slate-800 mb-6">

                Equipment Status Overview

            </h2>

            <ResponsiveContainer
                width="100%"
                height={340}
            >

                <PieChart>

                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={115}
                        label={({ name, value }) => `${name}: ${value}`}
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

    );

}