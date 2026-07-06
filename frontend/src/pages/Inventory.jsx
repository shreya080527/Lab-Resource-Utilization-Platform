import { useEffect, useState } from "react";
import { getInventory } from "../services/InventoryService";import { Link } from "react-router-dom";
export default function Inventory() {

    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {

        try {

            const response = await getInventory();

            setInventory(response.data);

        } catch (e) {

            console.log(e);

        }

    };

    return (

        <div className="min-h-screen bg-slate-100 p-8">

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-4xl font-bold">

                    Inventory Management

                </h1>

                <Link
                    to="/inventory/add"
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl"
                >
                    Add Inventory
                </Link>

            </div>

            <table className="w-full bg-white rounded-xl shadow">

                <thead className="bg-slate-900 text-white">

                <tr>

                    <th className="p-4">Equipment</th>

                    <th>Total</th>

                    <th>Available</th>

                    <th>Reserved</th>

                    <th>Maintenance</th>

                    <th>Minimum Stock</th>

                </tr>

                </thead>

                <tbody>

                {inventory.map(item => (

                    <tr
                        key={item.inventoryId}
                        className="border-b"
                    >

                        <td className="p-4">

                            {item.equipment.equipmentName}

                        </td>

                        <td>{item.totalQuantity}</td>

                        <td>{item.availableQuantity}</td>

                        <td>{item.reservedQuantity}</td>

                        <td>{item.maintenanceQuantity}</td>

                        <td>{item.minimumStock}</td>

                    </tr>

                ))}

                </tbody>

            </table>

        </div>

    );

}