import { useEffect, useState } from "react";
import { getCalendar } from "../services/BookingService";
import { getUserDetails } from "../services/authService";

export default function BookingCalendar() {

    const [loading, setLoading] = useState(true);

    const [bookings, setBookings] = useState([]);

    const [filters, setFilters] = useState({
        start: "",
        end: ""
    });

    useEffect(() => {

        const today = new Date();

        const start = today.toISOString().slice(0, 16);

        const end = new Date(
            today.getTime() + (7 * 24 * 60 * 60 * 1000)
        ).toISOString().slice(0, 16);

        setFilters({
            start,
            end
        });

    }, []);

    useEffect(() => {

        if (filters.start && filters.end) {

            loadCalendar();

        }

    }, [filters]);

    const loadCalendar = async () => {

        try {

            setLoading(true);

            const user = await getUserDetails();

            const response = await getCalendar(
                user.data.id,
                filters.start,
                filters.end
            );

            setBookings(response.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-slate-100 p-8">

            <h1 className="text-4xl font-bold mb-8">

                Booking Calendar

            </h1>

            <div className="bg-white rounded-xl shadow p-6 mb-8">

                <div className="grid md:grid-cols-2 gap-6">

                    <div>

                        <label className="font-semibold">

                            Start Date

                        </label>

                        <input
                            type="datetime-local"
                            value={filters.start}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    start: e.target.value
                                })
                            }
                            className="w-full border rounded-lg mt-2 p-3"
                        />

                    </div>

                    <div>

                        <label className="font-semibold">

                            End Date

                        </label>

                        <input
                            type="datetime-local"
                            value={filters.end}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    end: e.target.value
                                })
                            }
                            className="w-full border rounded-lg mt-2 p-3"
                        />

                    </div>

                </div>

            </div>

            <div className="bg-white rounded-xl shadow p-6">

                <h2 className="text-2xl font-bold mb-6">

                    Calendar Bookings

                </h2>

                {

                    loading ?

                        (

                            <h3>

                                Loading...

                            </h3>

                        )

                        :

                        bookings.length === 0 ?

                            (

                                <p>

                                    No bookings found.

                                </p>

                            )

                            :

                            (

                                <table className="w-full">

                                    <thead>

                                        <tr className="border-b">

                                            <th className="text-left py-3">

                                                Equipment

                                            </th>

                                            <th className="text-left">

                                                Start

                                            </th>

                                            <th className="text-left">

                                                End

                                            </th>

                                            <th className="text-left">

                                                Status

                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {

                                            bookings.map((booking) => (

                                                <tr
                                                    key={booking.id}
                                                    className="border-b"
                                                >

                                                    <td className="py-4">

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

                                                        {booking.status}

                                                    </td>

                                                </tr>

                                            ))

                                        }

                                    </tbody>

                                </table>

                            )

                }

            </div>

        </div>

    );

}