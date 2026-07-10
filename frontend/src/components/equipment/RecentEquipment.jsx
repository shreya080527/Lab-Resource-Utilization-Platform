import { Eye, Pencil, Trash2 } from "lucide-react";

export default function RecentEquipment({ equipment }) {

    if (!equipment.length) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
                No equipment found.
            </div>
        );
    }

    const getStatusColor = (status) => {

        switch (status) {

            case "AVAILABLE":
                return "bg-green-100 text-green-700";

            case "IN_USE":
                return "bg-yellow-100 text-yellow-700";

            case "MAINTENANCE":
                return "bg-red-100 text-red-700";

            case "RETIRED":
                return "bg-gray-200 text-gray-700";

            default:
                return "bg-blue-100 text-blue-700";
        }

    };

    return (

        <div>

            <h2 className="text-3xl font-bold mb-6">

                Recent Equipment

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {equipment.map((item) => (

                    <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl hover:-translate-y-1 duration-300"
                    >

                        <div className="flex justify-between items-center mb-4">

                            <h3 className="text-xl font-bold">

                                {item.equipmentName}

                            </h3>

                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}
                            >
                                {item.status}
                            </span>

                        </div>

                        <div className="space-y-2 text-gray-600">

                            <p>

                                <strong>Serial:</strong> {item.serial}

                            </p>

                            <p>

                                <strong>Category:</strong> {item.category}

                            </p>

                            <p>

                                <strong>Institution:</strong> {item.institution}

                            </p>

                            <p>

                                <strong>Added By:</strong> {item.addedBy}

                            </p>

                            <p className="line-clamp-2">

                                {item.description}

                            </p>

                        </div>

                        <div className="flex gap-3 mt-6">

                            <button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 flex justify-center items-center gap-2"
                            >
                                <Eye size={18} />

                                View
                            </button>

                            <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl p-2"
                            >
                                <Pencil size={18} />
                            </button>

                            <button
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-2"
                            >
                                <Trash2 size={18} />
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}