import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import {
    createBooking,
    getAllEquipment,
} from "../services/BookingService";

import { getUserDetails } from "../services/authService";

export default function BookEquipment() {

    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        equipmentId: "",
        startTime: "",
        endTime: "",
    });

    useEffect(() => {
        loadEquipment();
    }, []);

    const loadEquipment = async () => {
        try {
            const response = await getAllEquipment();

            console.log("Equipment Response:", response.data);

            if (Array.isArray(response.data)) {
                setEquipment(response.data);
            } else {
                setEquipment([]);
                toast.error("Equipment data is invalid.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Unable to load equipment.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const userResponse = await getUserDetails();

            const booking = {
                userId: userResponse.data.id,
                equipmentId: Number(formData.equipmentId),
                startTime: formData.startTime,
                endTime: formData.endTime,
            };

            const response = await createBooking(booking);

            toast.success(
                typeof response.data === "string"
                    ? response.data
                    : "Booking created successfully."
            );

            setFormData({
                equipmentId: "",
                startTime: "",
                endTime: "",
            });

        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Booking failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">

            <Toaster position="top-right" />

            <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-8">

                <h1 className="text-3xl font-bold mb-6">
                    Book Equipment
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block font-semibold mb-2">
                            Equipment
                        </label>

                        <select
                            name="equipmentId"
                            value={formData.equipmentId}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg p-3"
                        >
                            <option value="">
                                Select Equipment
                            </option>

                            {equipment.map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.equipmentName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">
                            Start Time
                        </label>

                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">
                            End Time
                        </label>

                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3"
                    >
                        {loading ? "Creating Booking..." : "Book Equipment"}
                    </button>

                </form>

            </div>

        </div>
    );
}