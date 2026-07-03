import React, { useState } from "react";

function EquipmentList() {

    const [search, setSearch] = useState("");

    const [equipment, setEquipment] = useState([
        {
            id: 1,
            name: "Laptop",
            category: "Computer",
            quantity: 20,
            status: "Available",
        },
        {
            id: 2,
            name: "Projector",
            category: "Electronics",
            quantity: 5,
            status: "In Use",
        },
        {
            id: 3,
            name: "Printer",
            category: "Office",
            quantity: 3,
            status: "Available",
        },
    ]);

    const addEquipment = () => {
        const name = prompt("Equipment Name");

        if (!name) return;

        const category = prompt("Category");
        const quantity = prompt("Quantity");
        const status = prompt("Status");

        const newItem = {
            id: equipment.length + 1,
            name,
            category,
            quantity,
            status,
        };

        setEquipment([...equipment, newItem]);
    };

    const deleteEquipment = (id) => {
        setEquipment(equipment.filter((item) => item.id !== id));
    };

    const editEquipment = (id) => {

        const updated = equipment.map((item) => {

            if (item.id === id) {

                return {
                    ...item,
                    name: prompt("New Name", item.name),
                    category: prompt("Category", item.category),
                    quantity: prompt("Quantity", item.quantity),
                    status: prompt("Status", item.status),
                };

            }

            return item;

        });

        setEquipment(updated);

    };

    const filteredEquipment = equipment.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container">

            <h1>Equipment List</h1>

            <div className="top-bar">

                <button onClick={addEquipment}>
                    Add Equipment
                </button>

                <input
                    type="text"
                    placeholder="Search Equipment..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            <table>

                <thead>

                <tr>

                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>

                </tr>

                </thead>

                <tbody>

                {filteredEquipment.map((item) => (

                    <tr key={item.id}>

                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.quantity}</td>
                        <td>{item.status}</td>

                        <td>

                            <button
                                className="edit"
                                onClick={() => editEquipment(item.id)}
                            >
                                Edit
                            </button>

                            <button
                                className="delete"
                                onClick={() => deleteEquipment(item.id)}
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                ))}

                </tbody>

            </table>

        </div>
    );
}

export default EquipmentList;