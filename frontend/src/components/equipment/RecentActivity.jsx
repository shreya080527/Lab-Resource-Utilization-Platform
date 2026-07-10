import {
    Package,
    PlusCircle,
    Wrench,
    Clock
} from "lucide-react";

export default function RecentActivity({ equipment }) {

    const recent = [...equipment]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    const getIcon = (status) => {

        switch (status) {

            case "AVAILABLE":
                return <Package className="text-green-600" size={22} />;

            case "MAINTENANCE":
                return <Wrench className="text-red-600" size={22} />;

            default:
                return <PlusCircle className="text-blue-600" size={22} />;

        }

    };

    return (

        <div className="bg-white rounded-3xl shadow-xl p-6">

            <h2 className="text-2xl font-bold mb-6">

                Recent Activity

            </h2>

            <div className="space-y-5">

                {

                    recent.map(item => (

                        <div
                            key={item.id}
                            className="flex items-center justify-between border-b pb-4"
                        >

                            <div className="flex items-center gap-4">

                                {getIcon(item.status)}

                                <div>

                                    <h3 className="font-semibold">

                                        {item.equipmentName}

                                    </h3>

                                    <p className="text-gray-500 text-sm">

                                        Status : {item.status}

                                    </p>

                                </div>

                            </div>

                            <div className="flex items-center gap-2 text-gray-400">

                                <Clock size={16} />

                                New

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}