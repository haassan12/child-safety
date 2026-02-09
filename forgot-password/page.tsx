"use client";

import { useState } from "react";
import Link from "next/link";
import API from "../services/api"; // We will add the method to api.ts next

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(""); // For demo purposes, we show the token

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        setToken("");

        try {
            const res = await API.post("/forgot-password", { email });
            setMessage({ type: "success", text: "Reset token generated! (See below)" });
            setToken(res.data.reset_token); // Backend returns token for testing
        } catch (err: any) {
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to request reset" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen d-flex align-items-center justify-content-center bg-dark">
            <div className="card card-dark p-5 rounded-4 shadow-lg w-100" style={{ maxWidth: "450px" }}>
                <div className="text-center mb-4">
                    <div className="display-4 mb-3">🔐</div>
                    <h2 className="fw-bold text-white">Forgot Password?</h2>
                    <p className="text-white opacity-75">Enter your email to receive a reset token.</p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-pill text-center`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label text-white fw-bold ps-3">Email Address</label>
                        <input
                            type="email"
                            className="form-control form-control-dark rounded-pill py-3 px-4"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-premium w-100 py-3 rounded-pill fw-bold mb-3 shadow"
                        disabled={loading}
                    >
                        {loading ? "Requesting..." : "Get Reset Token"}
                    </button>
                </form>

                {token && (
                    <div className="alert alert-info mt-3 break-all">
                        <strong>Your Reset Token:</strong><br />
                        <small className="user-select-all">{token}</small>
                        <div className="mt-2">
                            <Link href={`/reset-password?token=${token}&email=${email}`} className="btn btn-sm btn-dark rounded-pill">
                                Go to Reset Page →
                            </Link>
                        </div>
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link href="/login" className="text-decoration-none text-info fw-bold">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
