"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import API from "../services/api";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        const tokenParam = searchParams.get("token");
        if (emailParam) setEmail(emailParam);
        if (tokenParam) setToken(tokenParam);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await API.post("/reset-password", {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setMessage({ type: "success", text: "Password reset successful! Redirecting..." });
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to reset password" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen d-flex align-items-center justify-content-center bg-dark">
            <div className="card card-dark p-5 rounded-4 shadow-lg w-100" style={{ maxWidth: "450px" }}>
                <div className="text-center mb-4">
                    <div className="display-4 mb-3">🔑</div>
                    <h2 className="fw-bold text-white">Reset Password</h2>
                    <p className="text-white opacity-75">Enter your new password below.</p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-pill text-center`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label text-white fw-bold ps-3">Email Address</label>
                        <input
                            type="email"
                            className="form-control form-control-dark rounded-pill py-3 px-4"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-white fw-bold ps-3">Reset Token</label>
                        <input
                            type="text"
                            className="form-control form-control-dark rounded-pill py-3 px-4"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-white fw-bold ps-3">New Password</label>
                        <input
                            type="password"
                            className="form-control form-control-dark rounded-pill py-3 px-4"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-white fw-bold ps-3">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control form-control-dark rounded-pill py-3 px-4"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-premium w-100 py-3 rounded-pill fw-bold mb-3 shadow"
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <Link href="/login" className="text-decoration-none text-info fw-bold">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
