import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Boxes,
    User,
    LogOut,
} from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">

            <h1 className="text-2xl font-bold text-cyan-400 mb-10">
                LabResource
            </h1>

            <nav className="space-y-3">

                <Link
                    to="/dashboard"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800"
                >
                    <LayoutDashboard size={20}/>
                    Dashboard
                </Link>

                <Link
                    to="/equipment"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800"
                >
                    <Boxes size={20}/>
                    Equipment
                </Link>
                <Link
                    to="/inventory"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800"
                >

                    📦 Inventory

                </Link>
                <Link
                    to="/profile"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800"
                >
                    <User size={20}/>
                    Profile
                </Link>

                <button
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 w-full text-left"
                >
                    <LogOut size={20}/>
                    Logout
                </button>

            </nav>

        </aside>
    );
}
