import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { loginUser } from "../services/authService";
import { useAuth } from "../services/context/useauth";

export default function LoginPage() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        try {

            const response = await loginUser(formData);

            login(response.data);

            toast.success("Login Successful");

            navigate("/dashboard");

        } catch (err) {

            toast.error(
                err.response?.data?.message || "Invalid Username or Password"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <>
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 flex items-center justify-center p-8">

                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">

                    <h1 className="text-4xl font-bold text-white text-center">

                        Welcome Back 👋

                    </h1>

                    <p className="text-slate-300 text-center mt-3">

                        Login to your Lab Resource Platform

                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-10 space-y-6"
                    >

                        <div>

                            <label className="text-slate-200">

                                Username

                            </label>

                            <div className="relative mt-2">

                                <Mail
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter Username"
                                    className="w-full rounded-xl bg-slate-800 text-white pl-12 pr-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
                                    required
                                />

                            </div>

                        </div>

                        <div>

                            <label className="text-slate-200">

                                Password

                            </label>

                            <div className="relative mt-2">

                                <Lock
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter Password"
                                    className="w-full rounded-xl bg-slate-800 text-white pl-12 pr-12 py-3 outline-none border border-slate-700 focus:border-cyan-400"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-3 text-slate-400"
                                >

                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}

                                </button>

                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-xl py-3 font-semibold text-white"
                        >

                            {loading ? "Logging in..." : "Login"}

                        </button>

                    </form>

                    <p className="text-center text-slate-300 mt-8">

                        Don't have an account?

                        <Link
                            to="/signup"
                            className="text-cyan-400 ml-2 hover:underline"
                        >
                            Register
                        </Link>

                    </p>

                </div>

            </div>

        </>

    );

}