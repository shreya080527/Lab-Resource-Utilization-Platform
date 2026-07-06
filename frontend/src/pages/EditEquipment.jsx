import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEquipmentById,
    updateEquipment
} from "../services/equipmentService";

export default function EditEquipment() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [equipment, setEquipment] = useState({});

    useEffect(() => {

        loadEquipment();

    }, []);

    async function loadEquipment() {

        const response = await getEquipmentById(id);

        setEquipment(response.data);

    }

    function handleChange(e) {

        setEquipment({
            ...equipment,
            [e.target.name]: e.target.value
        });

    }

    async function handleSubmit(e) {

        e.preventDefault();

        await updateEquipment(id, equipment);

        alert("Equipment Updated");

        navigate("/equipment");

    }

    return (

        <div className="p-8">

            <h1 className="text-3xl font-bold mb-6">

                Edit Equipment

            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-xl"
            >

                <input
                    name="equipmentName"
                    value={equipment.equipmentName || ""}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <input
                    name="category"
                    value={equipment.category || ""}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <textarea
                    name="description"
                    value={equipment.description || ""}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <input
                    type="number"
                    name="quantity"
                    value={equipment.quantity || ""}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <input
                    type="number"
                    name="availableQuantity"
                    value={equipment.availableQuantity || ""}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <select
                    name="status"
                    value={equipment.status || "AVAILABLE"}
                    onChange={handleChange}
                    className="border p-3 w-full"
                >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="IN_USE">IN USE</option>
                </select>

                <button
                    className="bg-green-600 text-white px-6 py-3 rounded-lg"
                >
                    Update Equipment
                </button>

            </form>

        </div>

    );

}