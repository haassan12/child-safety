"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/app/services/api";
import { LoginResponse } from "@/app/types/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        let role = "";

        try {
            const res = await API.post<LoginResponse>("/login", { email, password });
            sessionStorage.setItem("token", res.data.token);
            sessionStorage.setItem("user", JSON.stringify(res.data.user));
            role = res.data.user.role;
        } catch (err) {
            setError("Invalid email or password");
            setLoading(false);
            return;
        }

        setLoading(false);

        if (role === "parent") {
            router.push("/parent-dashboard");
        } else if (role === "child") {
            router.push("/child-dashboard");
        } else {
            router.push("/admin-dashboard");
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5 col-lg-4">

                        {/* Dark Card */}
                        <div className="card card-dark p-4 rounded-4">
                            <div className="card-body text-center">

                                {/* Logo / Icon */}
                                <div className="mb-4">
                                    <div className="icon-box bg-white text-dark rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                                        <span className="fs-3">👤</span>
                                    </div>
                                </div>

                                <h2 className="fw-bold mb-1">LOGIN</h2>
                                <p className="text-secondary small mb-4">Enter your credentials to access</p>

                                {/* Error Alert */}
                                {error && (
                                    <div className="alert alert-danger py-2 small mb-3 border-0 bg-danger text-white">
                                        {error}
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3 text-start">
                                        <label className="form-label small text-secondary fw-bold">USERNAME</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-dark rounded-pill py-2 px-3"
                                            placeholder="Enter username"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-white fw-bold ps-3">Password</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-dark rounded-pill py-3 px-4"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <div className="text-end mt-2">
                                            <Link href="/forgot-password" className="text-decoration-none text-light opacity-75 small">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="mb-4 d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input className="form-check-input bg-secondary border-0" type="checkbox" id="rememberMe" />
                                            <label className="form-check-label small text-secondary" htmlFor="rememberMe">Remember me</label>
                                        </div>
                                        <Link href="/forgot-password" className="small text-decoration-none text-primary">Forgot?</Link>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary btn-premium w-100 rounded-pill py-2 fw-bold"
                                    >
                                        {loading ? "LOGGING IN..." : "LOGIN"}
                                    </button>
                                </form>

                                <div className="mt-4 text-secondary small">
                                    Don't have an account? <Link href="/register" className="text-primary text-decoration-none fw-bold">Sign Up</Link>
                                </div>

                            </div>
                        </div>

                        {/* Back Link */}
                        <div className="text-center mt-3">
                            <Link href="/" className="text-secondary text-decoration-none small">← Back to Home</Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
