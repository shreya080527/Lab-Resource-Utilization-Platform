import {
    Bell,
    UserCircle,
    Sun,
    LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/context/useauth";


export default function Topbar({ title, role }) {

    const username = localStorage.getItem("username") || "User";

    const navigate = useNavigate();

    const { logout } = useAuth();

    function handleLogout() {

        if (!window.confirm("Logout?")) return;

        logout();

        localStorage.removeItem("role");

        toast.success("Logged out Successfully 👋");

        setTimeout(() => {

            navigate("/login");

        }, 1200);

    }

    return (

        <div className="bg-white shadow-md px-8 py-5 flex justify-between items-center">

            <div>

                <h1 className="text-3xl font-bold">

                    {title}

                </h1>

                <p className="text-gray-500">

                    Welcome back,

                    <span className="ml-1 font-semibold text-cyan-600">

                        {username}

                    </span>

                </p>

            </div>

            <div className="flex items-center gap-5">

                <div className="hidden md:flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">

                    <Sun size={18} />

                    Good Day

                </div>

                <Bell
                    className="text-slate-600"
                />

                <div className="flex items-center gap-2">

                    <UserCircle
                        size={35}
                        className="text-cyan-600"
                    />

                    <div>

                        <p className="font-semibold">

                            {username}

                        </p>

                        <p className="text-sm text-gray-500">

                            {role.replaceAll("_", " ")}

                        </p>

                    </div>

                </div>

                <button

                    onClick={handleLogout}

                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"

                >

                    <LogOut size={18} />

                    Logout

                </button>

            </div>

        </div>

    );

}