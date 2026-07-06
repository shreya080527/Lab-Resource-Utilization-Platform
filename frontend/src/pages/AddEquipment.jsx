import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addEquipment } from "../services/equipmentService";

export default function AddEquipment() {

    const navigate = useNavigate();

    const [equipment, setEquipment] = useState({
        equipmentName: "",
        category: "",
        description: "",
        quantity: "",
        availableQuantity: "",
        status: "AVAILABLE"
    });

    const handleChange = (e) => {
        setEquipment({
            ...equipment,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addEquipment(equipment);

            alert("Equipment Added Successfully");

            navigate("/equipment");

        } catch (err) {

            console.log(err);
            alert("Failed to add equipment");

        }

    };

    return (

        <div className="p-8">

            <h1 className="text-3xl font-bold mb-6">
                Add Equipment
            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-xl"
            >

                <input
                    name="equipmentName"
                    placeholder="Equipment Name"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <input
                    name="category"
                    placeholder="Category"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <textarea
                    name="description"
                    placeholder="Description"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="quantity"
                    placeholder="Total Quantity"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="availableQuantity"
                    placeholder="Available Quantity"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <select
                    name="status"
                    className="border p-3 w-full"
                    onChange={handleChange}
                >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="IN_USE">IN USE</option>
                </select>

                <button
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                    Save Equipment
                </button>

            </form>

        </div>

    );

}