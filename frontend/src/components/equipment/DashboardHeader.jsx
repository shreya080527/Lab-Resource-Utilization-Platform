import {
    CalendarDays,
    Clock3
} from "lucide-react";

export default function DashboardHeader() {

    const username =
        localStorage.getItem("username") || "Lab Manager";

    const today = new Date();

    return (

        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">

            <div className="flex flex-col lg:flex-row justify-between">

                <div>

                    <h1 className="text-4xl font-bold">

                        Welcome Back 👋

                    </h1>

                    <h2 className="text-2xl mt-2">

                        {username}

                    </h2>

                    <p className="mt-3 text-cyan-100">

                        Manage laboratory equipment, inventory and bookings efficiently.

                    </p>

                </div>

                <div className="mt-6 lg:mt-0 space-y-4">

                    <div className="flex items-center gap-3">

                        <CalendarDays size={22} />

                        {today.toLocaleDateString()}

                    </div>

                    <div className="flex items-center gap-3">

                        <Clock3 size={22} />

                        {today.toLocaleTimeString()}

                    </div>

                </div>

            </div>

        </div>

    );

}