"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/app/services/api";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("child");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name || !email || !password) {
            setError("Please fill in all fields");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Min 6 chars required");
            return;
        }

        setLoading(true);

        try {
            await API.post("/register", {
                name, email, password,
                password_confirmation: confirmPassword,
                role,
            });
            setSuccess("Account created!");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
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

                                {/* Icon */}
                                <div className="mb-4">
                                    <div className="icon-box bg-white text-dark rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                                        <span className="fs-3">✨</span>
                                    </div>
                                </div>

                                <h2 className="fw-bold mb-1">REGISTER</h2>
                                <p className="text-secondary small mb-4">Create your SafeKids account</p>

                                {error && (
                                    <div className="alert alert-danger py-2 small mb-3 border-0 bg-danger text-white">{error}</div>
                                )}
                                {success && (
                                    <div className="alert alert-success py-2 small mb-3 border-0 bg-success text-white">{success}</div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleRegister}>
                                    <div className="mb-3 text-start">
                                        <label className="form-label small text-secondary fw-bold">FULL NAME</label>
                                        <input type="text" className="form-control form-control-dark rounded-pill py-2 px-3"
                                            value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                                    </div>

                                    <div className="mb-3 text-start">
                                        <label className="form-label small text-secondary fw-bold">EMAIL</label>
                                        <input type="email" className="form-control form-control-dark rounded-pill py-2 px-3"
                                            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                                    </div>

                                    <div className="mb-3 text-start">
                                        <label className="form-label small text-secondary fw-bold">ROLE</label>
                                        <select className="form-select form-control-dark rounded-pill py-2 px-3 border-0"
                                            value={role} onChange={(e) => setRole(e.target.value)}>
                                            <option value="child">👧 Child</option>
                                            <option value="parent">👨‍👩‍👧 Parent</option>
                                        </select>
                                    </div>

                                    <div className="mb-3 text-start">
                                        <label className="form-label small text-secondary fw-bold">PASSWORD</label>
                                        <input type="password" className="form-control form-control-dark rounded-pill py-2 px-3"
                                            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
                                    </div>

                                    <div className="mb-4 text-start">
                                        <label className="form-label small text-secondary fw-bold">CONFIRM</label>
                                        <input type="password" className="form-control form-control-dark rounded-pill py-2 px-3"
                                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="******" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary btn-premium w-100 rounded-pill py-2 fw-bold"
                                    >
                                        {loading ? "CREATING..." : "REGISTER"}
                                    </button>
                                </form>

                                <div className="mt-4 text-secondary small">
                                    Already have an account? <Link href="/login" className="text-primary text-decoration-none fw-bold">Login</Link>
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
