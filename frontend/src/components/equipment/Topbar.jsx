import {
    Bell,
    UserCircle,
    Sun,
    LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Topbar({ title, role }) {

    const navigate = useNavigate();

    const username =
        localStorage.getItem("username") || "Lab Manager";

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good Morning"
            : hour < 17
                ? "Good Afternoon"
                : "Good Evening";

    function handleLogout() {

        localStorage.clear();

        navigate("/login", {
            replace: true
        });

    }

    return (

        <div className="bg-white shadow-lg rounded-2xl px-8 py-5 flex justify-between items-center">

            {/* Left */}

            <div>

                <h1 className="text-3xl font-bold text-slate-800">

                    {title}

                </h1>

                <p className="text-slate-500 mt-2">

                    {greeting},

                    <span className="font-semibold text-cyan-600 ml-2">

                        {username}

                    </span>

                    👋

                </p>

            </div>

            {/* Right */}

            <div className="flex items-center gap-5">

                <div className="hidden lg:flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">

                    <Sun size={18} />

                    {greeting}

                </div>

                <button
                    className="relative"
                >

                    <Bell
                        size={24}
                        className="text-slate-700 hover:text-cyan-600 transition"
                    />

                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">

                        0

                    </span>

                </button>

                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full">

                    <UserCircle
                        size={34}
                        className="text-cyan-600"
                    />

                    <div>

                        <p className="font-semibold">

                            {username}

                        </p>

                        <p className="text-xs text-slate-500">

                            {role.replaceAll("_", " ")}

                        </p>

                    </div>

                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                >

                    <LogOut size={18} />

                    Logout

                </button>

            </div>

        </div>

    );

}