import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { verifyEmail, resendOtp } from "../services/authService";

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [otp, setOtp] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyEmail({ email, otp });
            toast.success("Email verified successfully!");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        try {
            await resendOtp({ email });
            toast.success("OTP resent successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResending(false);
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
                        Verify Email
                    </h1>

                    <p className="text-slate-300 text-center mt-3">
                        Enter the OTP sent to your email
                    </p>

                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-3 mt-6">
                        <Mail className="text-slate-400" size={20} />
                        <span className="text-slate-300 text-sm">{email}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="text-slate-200">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-full mt-2 rounded-xl bg-slate-800 text-white p-3 outline-none border border-slate-700 focus:border-cyan-400"
                                required
                                maxLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-xl py-3 font-semibold text-white"
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>

                    <button
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="w-full mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                        {resending ? "Resending..." : "Resend OTP"}
                    </button>
                </div>
            </div>
        </>
    );
}
