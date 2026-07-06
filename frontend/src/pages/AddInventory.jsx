import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addInventory } from "../services/InventoryService";
export default function AddInventory() {

    const navigate = useNavigate();

    const [inventory, setInventory] = useState({
        equipmentId: "",
        totalQuantity: "",
        availableQuantity: "",
        reservedQuantity: 0,
        maintenanceQuantity: 0,
        minimumStock: 2
    });

    const handleChange = (e) => {
        setInventory({
            ...inventory,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const data = {
                equipment: {
                    equipmentId: inventory.equipmentId
                },
                totalQuantity: inventory.totalQuantity,
                availableQuantity: inventory.availableQuantity,
                reservedQuantity: inventory.reservedQuantity,
                maintenanceQuantity: inventory.maintenanceQuantity,
                minimumStock: inventory.minimumStock
            };

            await addInventory(data);

            alert("Inventory Added");

            navigate("/inventory");

        } catch (e) {

            alert("Failed");

            console.log(e);

        }

    };

    return (

        <div className="p-8">

            <h1 className="text-3xl font-bold mb-6">
                Add Inventory
            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                <input
                    type="number"
                    name="equipmentId"
                    placeholder="Equipment ID"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="totalQuantity"
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

                <input
                    type="number"
                    name="minimumStock"
                    placeholder="Minimum Stock"
                    className="border p-3 w-full"
                    onChange={handleChange}
                />

                <button
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                    Save Inventory
                </button>

            </form>

        </div>

    );

}