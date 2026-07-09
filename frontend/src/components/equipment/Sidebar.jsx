import {
    LayoutDashboard,
    Package,
    Boxes,
    CalendarDays,
    ClipboardList,
    Wrench,
    ChevronRight
} from "lucide-react";

import { NavLink } from "react-router-dom";

export default function Sidebar({ role }) {

    const managerMenu = [

        {
            title: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/lab-manager/dashboard"
        },

        {
            title: "Equipment",
            icon: <Package size={20} />,
            path: "/equipment"
        },

        {
            title: "Inventory",
            icon: <Boxes size={20} />,
            path: "/inventory"
        }

    ];

    const researcherMenu = [

        {
            title: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/researcher/dashboard"
        },

        {
            title: "Book Equipment",
            icon: <CalendarDays size={20} />,
            path: "/researcher/book-equipment"
        },

        {
            title: "My Bookings",
            icon: <ClipboardList size={20} />,
            path: "/researcher/bookings"
        }

    ];

    const technicianMenu = [

        {
            title: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/technician/dashboard"
        },

        {
            title: "Equipment",
            icon: <Package size={20} />,
            path: "/equipment"
        },

        {
            title: "Maintenance",
            icon: <Wrench size={20} />,
            path: "/maintenance"
        }

    ];

    const departmentMenu = [

        {
            title: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/department/dashboard"
        },

        {
            title: "Equipment",
            icon: <Package size={20} />,
            path: "/equipment"
        }

    ];

    let menu = [];

    switch (role) {

        case "LAB_MANAGER":
            menu = managerMenu;
            break;

        case "RESEARCHER":
            menu = researcherMenu;
            break;

        case "LAB_TECHNICIAN":
            menu = technicianMenu;
            break;

        case "DEPARTMENT_HEAD":
            menu = departmentMenu;
            break;

        default:
            menu = [];
    }

    return (

        <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl">

            {/* Logo */}

            <div className="p-8 border-b border-slate-700">

                <h1 className="text-2xl font-extrabold text-cyan-400">

                    Lab Resource

                </h1>

                <p className="text-slate-400 text-sm mt-2">

                    Utilization Platform

                </p>

            </div>

            {/* Menu */}

            <div className="flex-1 px-4 py-6 space-y-2">

                {

                    menu.map((item) => (

                        <NavLink

                            key={item.title}

                            to={item.path}

                            className={({ isActive }) =>

                                `flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-300

                                ${

                                    isActive

                                        ? "bg-cyan-600 shadow-lg"

                                        : "hover:bg-slate-800"

                                }`

                            }

                        >

                            <div className="flex items-center gap-3">

                                {item.icon}

                                <span className="font-medium">

                                    {item.title}

                                </span>

                            </div>

                            <ChevronRight size={18} />

                        </NavLink>

                    ))

                }

            </div>

            {/* Footer */}

            <div className="border-t border-slate-700 p-5">

                <div className="bg-slate-800 rounded-xl p-4">

                    <h3 className="font-semibold text-cyan-400">

                        {role.replaceAll("_", " ")}

                    </h3>

                    <p className="text-slate-400 text-sm mt-1">

                        Logged In

                    </p>

                </div>

            </div>

        </div>

    );

}