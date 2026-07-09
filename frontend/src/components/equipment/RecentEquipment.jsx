import { Link } from "react-router-dom";

export default function RecentEquipment({ equipment }) {

    return (

        <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold">

                    Recent Equipment

                </h2>

                <Link
                    to="/equipment"
                    className="text-cyan-600 hover:underline"
                >
                    View All
                </Link>

            </div>

            <table className="w-full">

                <thead>

                    <tr className="border-b text-left">

                        <th className="py-3">Serial</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        equipment.slice(0,5).map(item => (

                            <tr
                                key={item.id}
                                className="border-b hover:bg-slate-50"
                            >

                                <td className="py-4">

                                    {item.serial}

                                </td>

                                <td>

                                    {item.equipmentName}

                                </td>

                                <td>

                                    {item.category}

                                </td>

                                <td>

                                    <span
                                        className={`px-3 py-1 rounded-full text-white text-sm

                                        ${
                                            item.status==="AVAILABLE"
                                                ? "bg-green-600"
                                                : ""
                                        }

                                        ${
                                            item.status==="MAINTENANCE"
                                                ? "bg-yellow-500"
                                                : ""
                                        }

                                        ${
                                            item.status==="IN_USE"
                                                ? "bg-blue-600"
                                                : ""
                                        }

                                        ${
                                            item.status==="RETIRED"
                                                ? "bg-gray-600"
                                                : ""
                                        }

                                        `}
                                    >

                                        {item.status}

                                    </span>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}