import { useEffect, useState } from "react";
import { getResearcherDashboard } from "../services/BookingService";
import { getUserDetails } from "../services/authService";

export default function MyBookings() {

    const [loading, setLoading] = useState(true);

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {

        try {

            const user = await getUserDetails();

            const response = await getResearcherDashboard(user.data.id);

            setBookings(response.data.bookings);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    const getBadgeColor = (status) => {

        switch (status) {

            case "PENDING":
                return "bg-yellow-100 text-yellow-700";

            case "CONFIRMED":
                return "bg-green-100 text-green-700";

            case "COMPLETED":
                return "bg-blue-100 text-blue-700";

            case "CANCELLED":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";

        }

    };

    if (loading) {

        return (

            <div className="flex justify-center items-center h-screen">

                <h2 className="text-2xl font-bold">

                    Loading...

                </h2>

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-slate-100 p-8">

            <h1 className="text-4xl font-bold mb-8">

                My Bookings

            </h1>

            <div className="bg-white rounded-xl shadow overflow-hidden">

                <table className="w-full">

                    <thead className="bg-slate-200">

                        <tr>

                            <th className="text-left p-4">
                                Equipment
                            </th>

                            <th className="text-left">
                                Start Time
                            </th>

                            <th className="text-left">
                                End Time
                            </th>

                            <th className="text-left">
                                Status
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {
                            bookings.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan="4"
                                            className="text-center p-8"
                                        >

                                            No bookings found.

                                        </td>

                                    </tr>

                                )

                                :

                                (

                                    bookings.map((booking) => (

                                        <tr
                                            key={booking.id}
                                            className="border-b hover:bg-slate-50"
                                        >

                                            <td className="p-4">

                                                {
                                                    booking.equipment?.equipmentName ||
                                                    booking.equipment?.name ||
                                                    "Equipment"
                                                }

                                            </td>

                                            <td>

                                                {booking.startTime}

                                            </td>

                                            <td>

                                                {booking.endTime}

                                            </td>

                                            <td>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm ${getBadgeColor(booking.status)}`}
                                                >

                                                    {booking.status}

                                                </span>

                                            </td>

                                        </tr>

                                    ))

                                )

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}