import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEquipmentById,
    updateEquipment
} from "../services/equipmentService";

export default function EditEquipment() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState({
        equipmentName: "",
        category: "",
        description: "",
        institution: ""
    });

    useEffect(() => {
        loadEquipment();
    }, []);

    async function loadEquipment() {
        try {
            const response = await getEquipmentById(id);
            setEquipment(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to load equipment");
        }
    }

    function handleChange(e) {
        setEquipment({
            ...equipment,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            await updateEquipment(id, {
                equipmentName: equipment.equipmentName,
                category: equipment.category,
                description: equipment.description,
                institution: equipment.institution
            });

            alert("Equipment Updated Successfully");
            navigate("/equipment");

        } catch (error) {
            console.error(error);
            alert("Update Failed");
        }
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
                    type="text"
                    name="equipmentName"
                    placeholder="Equipment Name"
                    value={equipment.equipmentName}
                    onChange={handleChange}
                    className="border p-3 w-full rounded"
                />

                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={equipment.category}
                    onChange={handleChange}
                    className="border p-3 w-full rounded"
                />

                <textarea
                    name="description"
                    placeholder="Description"
                    value={equipment.description}
                    onChange={handleChange}
                    className="border p-3 w-full rounded"
                    rows={4}
                />

                <input
                    type="text"
                    name="institution"
                    placeholder="Institution"
                    value={equipment.institution}
                    onChange={handleChange}
                    className="border p-3 w-full rounded"
                />

                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                >
                    Update Equipment
                </button>

            </form>

        </div>
    );
}