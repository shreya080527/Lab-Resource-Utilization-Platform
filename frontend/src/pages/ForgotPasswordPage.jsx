import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { resetPasswordRequest } from "../services/authService";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await resetPasswordRequest({ email });
            toast.success("Reset OTP sent successfully!");
            setTimeout(() => navigate("/reset-password", { state: { email } }), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send reset OTP");
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
                        Forgot Password
                    </h1>

                    <p className="text-slate-300 text-center mt-3">
                        Enter your email to receive a password reset OTP
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="text-slate-200">Email</label>
                            <div className="relative mt-2">
                                <Mail
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
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
                            {loading ? "Sending..." : "Send Reset OTP"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
