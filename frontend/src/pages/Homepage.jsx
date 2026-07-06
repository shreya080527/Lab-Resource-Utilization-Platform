import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Homepage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

            {/* Navbar */}
            <nav className="flex items-center justify-between px-10 py-6">

                <h1 className="text-3xl font-bold tracking-wide">
                    LabResource
                </h1>

                <div className="space-x-4">

                    <Link
                        to="/login"
                        className="px-5 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition"
                    >
                        Login
                    </Link>

                    <Link
                        to="/signup"
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                    >
                        Sign Up
                    </Link>

                </div>

            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-10 py-24">

                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left */}
                    <div>

                        <h1 className="text-6xl font-extrabold leading-tight">

                            Smart Lab

                            <span className="block text-cyan-400">
                Resource Utilization
              </span>

                        </h1>

                        <p className="mt-8 text-xl text-slate-300 leading-8">

                            Modern platform for managing laboratory equipment,
                            bookings, researchers and analytics.

                            Built for Universities, Research Centers and Institutions.

                        </p>

                        <div className="mt-10 flex gap-5">

                            <Link
                                to="/signup"
                                className="bg-cyan-500 hover:bg-cyan-600 px-7 py-4 rounded-xl font-semibold flex items-center gap-2 transition"
                            >
                                Get Started

                                <ArrowRight size={20} />

                            </Link>

                            <Link
                                to="/login"
                                className="border border-slate-500 px-7 py-4 rounded-xl hover:bg-slate-800 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/inventory"
                                className="bg-blue-600 text-white px-5 py-3 rounded-xl"
                            >
                                Inventory
                            </Link>

                        </div>

                    </div>

                    {/* Right */}
                    <div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

                            <h2 className="text-3xl font-bold mb-8">

                                Live Statistics

                            </h2>

                            <div className="grid grid-cols-2 gap-6">

                                <div className="bg-slate-800 rounded-xl p-6">

                                    <h3 className="text-5xl font-bold text-cyan-400">

                                        248

                                    </h3>

                                    <p className="mt-2 text-slate-300">

                                        Equipment

                                    </p>

                                </div>

                                <div className="bg-slate-800 rounded-xl p-6">

                                    <h3 className="text-5xl font-bold text-green-400">

                                        89%

                                    </h3>

                                    <p className="mt-2 text-slate-300">

                                        Utilization

                                    </p>

                                </div>

                                <div className="bg-slate-800 rounded-xl p-6">

                                    <h3 className="text-5xl font-bold text-yellow-400">

                                        156

                                    </h3>

                                    <p className="mt-2 text-slate-300">

                                        Researchers

                                    </p>

                                </div>

                                <div className="bg-slate-800 rounded-xl p-6">

                                    <h3 className="text-5xl font-bold text-pink-400">

                                        12

                                    </h3>

                                    <p className="mt-2 text-slate-300">

                                        Departments

                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}