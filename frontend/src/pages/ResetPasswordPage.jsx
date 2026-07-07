import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
        otp: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email,
                newPassword: formData.newPassword,
                otp: formData.otp
            });
            toast.success("Password changed successfully!");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-slate-300 hover:text-white mb-6 flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>

                    <h1 className="text-4xl font-bold text-white text-center">
                        Reset Password
                    </h1>

                    <p className="text-slate-300 text-center mt-3">
                        Enter the OTP and your new password
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="text-slate-200">OTP</label>
                            <input
                                type="text"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="Enter 6-digit OTP"
                                className="w-full mt-2 rounded-xl bg-slate-800 text-white p-3 outline-none border border-slate-700 focus:border-cyan-400"
                                required
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label className="text-slate-200">New Password</label>
                            <div className="relative mt-2">
                                <Lock
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className="w-full rounded-xl bg-slate-800 text-white pl-12 pr-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-slate-200">Confirm Password</label>
                            <div className="relative mt-2">
                                <Lock
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className="w-full rounded-xl bg-slate-800 text-white pl-12 pr-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-xl py-3 font-semibold text-white"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
