import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getAllEquipment,
    deleteEquipment
} from "../services/equipmentService";

export default function Equipment() {

    const [equipment, setEquipment] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    const role = localStorage.getItem("role");

    useEffect(() => {
        loadEquipment();
    }, []);

    async function loadEquipment() {

        try {

            const response = await getAllEquipment();
            setEquipment(response.data);

        } catch (error) {

            console.log(error);

        }

    }

    async function removeEquipment(id) {

        if (!window.confirm("Delete this equipment?")) return;

        await deleteEquipment(id);

        loadEquipment();

    }

    return (

        <div className="p-8">

            {/* Header */}

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-4xl font-bold">
                    Equipment Management
                </h1>

                {(role === "LAB_MANAGER" || role === "INSTITUTION_ADMIN") && (

                    <Link
                        to="/equipment/add"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
                    >
                        Add Equipment
                    </Link>

                )}

            </div>

            {/* Search & Filter */}

            <div className="flex gap-4 mb-6">

                <input
                    type="text"
                    placeholder="Search Equipment..."
                    className="border p-3 rounded-lg w-80"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border p-3 rounded-lg"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="Biology">Biology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                </select>

            </div>

            {/* Table */}

            <table className="w-full bg-white shadow rounded-xl">

                <thead className="bg-slate-900 text-white">

                <tr>

                    <th className="p-3">Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th>Action</th>

                </tr>

                </thead>

                <tbody>

                {equipment
                    .filter(item =>
                        item.equipmentName
                            .toLowerCase()
                            .includes(search.toLowerCase())
                    )
                    .filter(item =>
                        category === "" || item.category === category
                    )
                    .map(item => (

                        <tr
                            key={item.equipmentId}
                            className="border-b hover:bg-gray-50"
                        >

                            <td className="p-3 font-medium">
                                {item.equipmentName}
                            </td>

                            <td>{item.category}</td>

                            <td>{item.quantity}</td>

                            <td>{item.availableQuantity}</td>

                            <td>

                                    <span
                                        className={`px-3 py-1 rounded-full text-white text-sm

                                        ${item.status === "AVAILABLE" ? "bg-green-600" : ""}

                                        ${item.status === "MAINTENANCE" ? "bg-yellow-500" : ""}

                                        ${item.status === "IN_USE" ? "bg-red-600" : ""}
                                        `}
                                    >
                                        {item.status}
                                    </span>

                            </td>

                            <td>

                                {(role === "LAB_MANAGER" ||
                                    role === "INSTITUTION_ADMIN") && (

                                    <>

                                        <Link
                                            to={`/equipment/edit/${item.equipmentId}`}
                                            className="text-blue-600 hover:underline mr-4"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            onClick={() => removeEquipment(item.equipmentId)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>

                                    </>

                                )}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}