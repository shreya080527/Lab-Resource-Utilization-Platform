import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addEquipment } from "../services/equipmentService";

export default function AddEquipment() {

    const navigate = useNavigate();

    const [equipment, setEquipment] = useState({
        serial: "",
        equipmentName: "",
        category: "",
        description: "",
        institution: ""
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

            console.log("Sending Data:", equipment);

            const response = await addEquipment(equipment);

            console.log(response.data);

            alert("Equipment Added Successfully");

            navigate("/equipment");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                err.response?.data ||
                "Failed to add equipment"
            );

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
                    name="serial"
                    placeholder="Serial Number"
                    value={equipment.serial}
                    onChange={handleChange}
                    className="border p-3 w-full"
                    required
                />

                <input
                    name="equipmentName"
                    placeholder="Equipment Name"
                    value={equipment.equipmentName}
                    onChange={handleChange}
                    className="border p-3 w-full"
                    required
                />

                <input
                    name="category"
                    placeholder="Category"
                    value={equipment.category}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <textarea
                    name="description"
                    placeholder="Description"
                    value={equipment.description}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <input
                    name="institution"
                    placeholder="Institution"
                    value={equipment.institution}
                    onChange={handleChange}
                    className="border p-3 w-full"
                />

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full"
                >
                    Save Equipment
                </button>

            </form>

        </div>

    );

}