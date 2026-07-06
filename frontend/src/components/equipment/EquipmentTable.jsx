import { Pencil, Trash2 } from "lucide-react";

export default function EquipmentTable({
                                           equipment,
                                           onEdit,
                                           onDelete,
                                       }) {

    return (

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

            <table className="w-full">

                <thead className="bg-slate-900 text-white">

                <tr>

                    <th className="p-4">ID</th>
                    <th className="p-4">Equipment Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Available</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>

                </tr>

                </thead>

                <tbody>

                {equipment.map((item) => (

                    <tr
                        key={item.equipmentId}
                        className="border-b hover:bg-slate-100"
                    >

                        <td className="p-4">
                            {item.equipmentId}
                        </td>

                        <td className="p-4">
                            {item.equipmentName}
                        </td>

                        <td className="p-4">
                            {item.category}
                        </td>

                        <td className="p-4">
                            {item.quantity}
                        </td>

                        <td className="p-4">
                            {item.availableQuantity}
                        </td>

                        <td className="p-4">

    <span
        className={`px-3 py-1 rounded-full text-white

        ${item.status==="AVAILABLE"?"bg-green-600":""}

        ${item.status==="MAINTENANCE"?"bg-yellow-500":""}

        ${item.status==="IN_USE"?"bg-red-600":""}

        `}
    >

        {item.status}

    </span>

                        </td>
                        <td className="p-4 flex gap-3 justify-center">

                            <button
                                onClick={() => onEdit(item.equipmentId)}
                                className="text-blue-600"
                            >
                                <Pencil size={18}/>
                            </button>

                            <button
                                onClick={() => onDelete(item.equipmentId)}
                                className="text-red-600"
                            >
                                <Trash2 size={18}/>
                            </button>

                        </td>

                    </tr>

                ))}

                </tbody>

            </table>

        </div>

    );

}