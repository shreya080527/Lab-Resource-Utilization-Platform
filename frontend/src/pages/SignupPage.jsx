import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Building2, School } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { registerUser } from "../services/authService";

const ROLES = [
    "RESEARCHER",
    "LAB_TECHNICIAN",
    "LAB_MANAGER",
    "DEPARTMENT_HEAD",
    "INSTITUTION_ADMIN",
    "SYSTEM_ADMIN"
];

export default function SignupPage() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "RESEARCHER",
        department: "",
        institution: ""
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

            const response = await registerUser(formData);

            toast.success(response.data.message || "Registration Successful! Please check your email for OTP.");

            setTimeout(() => navigate("/verify-otp", { state: { email: formData.email } }), 1500);

        } catch (err) {

            toast.error(
                err.response?.data?.message || "Registration Failed"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <>
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 flex items-center justify-center p-8">

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-10 w-full max-w-2xl">

                    <h1 className="text-4xl text-center font-bold text-white">

                        Create Account

                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-2 gap-5 mt-10"
                    >

                        <input
                            name="username"
                            placeholder="Username"
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                            required
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                            required
                        />

                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                        >
                            {ROLES.map(role => (
                                <option key={role}>{role}</option>
                            ))}
                        </select>

                        <input
                            name="department"
                            placeholder="Department"
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                        />

                        <input
                            name="institution"
                            placeholder="Institution"
                            onChange={handleChange}
                            className="p-3 rounded-xl bg-slate-800 text-white"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="col-span-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl py-3 text-white font-bold"
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>

                    </form>

                    <p className="text-center mt-8 text-slate-300">

                        Already have an account?

                        <Link
                            to="/login"
                            className="text-cyan-400 ml-2"
                        >
                            Login
                        </Link>

                    </p>

                </div>

            </div>

        </>
    );

}