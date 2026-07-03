import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './services/context/useauth'; // Make sure this path correctly points to your hook!

export default function HomePage() {
    const { user, logout } = useAuth(); // Read the logged-in user profile from context
    console.log("user ",user);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/70 backdrop-blur-md shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                L
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
                LabResource
            </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">

            {/* User Card */}
            {user && (
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:shadow-sm transition">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                        {user.firstname?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="hidden sm:block leading-tight">
                        <p className="text-sm font-semibold text-gray-900">
                            {user.username}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {user.role}
                        </p>
                    </div>
                </div>
            )}

            {/* Logout */}
            {user && (
                <button
                    onClick={logout}
                    className="px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-100
                               hover:bg-red-100 hover:text-red-700 transition text-sm font-medium"
                >
                    Logout
                </button>
            )}

            {/* Guest fallback (optional) */}
            {!user && (
                <div className="flex items-center gap-2">
                    <Link
                        to="/login"
                        className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Login
                    </Link>
                    <Link
                        to="/signup"
                        className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
                    >
                        Sign Up
                    </Link>
                </div>
            )}

        </div>
    </div>
</header>

            {/* Hero Section */}
            <main>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
                    <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                        Optimize Your Lab Resources <br />
                        <span className="text-indigo-600">Accelerate Scientific Discovery</span>
                    </h1>
                    <div className="mt-10 flex justify-center gap-x-6">
                        
                        {user ? (
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                                A unified platform for Researchers, Lab Managers, and Institutional Admins to schedule equipment, monitor utilization, and streamline tracking.
                            </p>
                        ) : (
                            <>
                                <Link to="/signup" className="rounded-xl bg-indigo-600 px-6 py-3 text-md font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors">
                                    Register Lab Profile
                                </Link>
                                <Link to="/login" className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-md font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                                    Access Dashboard &rarr;
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-white py-24 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Built for Every Institutional Tier
                            </h2>
                            <p className="mt-4 text-gray-600">
                                Robust tools mapped precisely to your organizational workflows.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                                <div className="text-2xl mb-4">🔬</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Resource Scheduling</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Researchers and Lab Technicians can cleanly book high-value machinery, view calendar queues, and track project execution hours.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                                <div className="text-2xl mb-4">📊</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Management Audits</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Lab Managers and Department Heads gain deep visual insights into device utilization data, down-times, and cost logs.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                                <div className="text-2xl mb-4">🏛️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Administrative Control</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Institution and System Admins manage cross-department permissions, system integrations, and global user lifecycle registries safely.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}