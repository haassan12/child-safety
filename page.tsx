"use client";

import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-light">

            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 shadow-lg">
                <div className="container">
                    <Link href="/" className="navbar-brand fw-bold d-flex align-items-center">
                        <span className="me-2 text-primary fs-4">🛡️</span> SafeChild
                    </Link>
                    <div className="d-flex gap-3">
                        <Link href="/login" className="btn btn-outline-light rounded-pill px-4">Login</Link>
                        <Link href="/register" className="btn btn-primary rounded-pill px-4 fw-bold">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container mt-5">
                <div className="row justify-content-center text-center">
                    <div className="col-lg-8">
                        <h1 className="display-4 fw-bold text-dark mb-4">
                            Keep Your Children <span className="text-primary">Safe & Protected</span>
                        </h1>
                        <p className="lead text-secondary mb-5">
                            Real-time journey tracking and instant SOS alerts for complete peace of mind.
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                            <Link href="/register" className="btn btn-primary btn-lg rounded-pill px-5 py-3 shadow-lg fw-bold">
                                Get Started Free →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Cards */}
            <div className="container my-5 py-5">
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card card-dark h-100 p-4 rounded-4 text-center">
                            <div className="icon-box bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                                <span className="fs-2">📍</span>
                            </div>
                            <h4 className="fw-bold mb-3">Live Tracking</h4>
                            <p className="text-light opacity-75 small">Monitor your child's location in real-time with precise GPS tracking.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card card-dark h-100 p-4 rounded-4 text-center">
                            <div className="icon-box bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                                <span className="fs-2">🆘</span>
                            </div>
                            <h4 className="fw-bold mb-3">SOS Alerts</h4>
                            <p className="text-light opacity-75 small">Instant emergency alerts sent directly to your phone when needed.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card card-dark h-100 p-4 rounded-4 text-center">
                            <div className="icon-box bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                                <span className="fs-2">🔒</span>
                            </div>
                            <h4 className="fw-bold mb-3">Secure Data</h4>
                            <p className="text-light opacity-75 small">Bank-level encryption keeps your family's data private and secure.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access */}
            {/* <div className="container mb-5 pb-5">
                <div className="card bg-white shadow-lg border-0 rounded-4 p-5">
                    <h3 className="fw-bold text-dark mb-4 text-center">Quick Access</h3>
                    <div className="row g-3">
                        <div className="col-6 col-md-3">
                            <Link href="/child-dashboard" className="card bg-light border-0 p-4 text-center text-decoration-none hover-shadow transition">
                                <span className="display-4 d-block mb-2">👧</span>
                                <span className="text-dark fw-bold">Child</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link href="/parent-dashboard" className="card bg-light border-0 p-4 text-center text-decoration-none hover-shadow transition">
                                <span className="display-4 d-block mb-2">👨‍👩‍👧</span>
                                <span className="text-dark fw-bold">Parent</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link href="/child-journey" className="card bg-light border-0 p-4 text-center text-decoration-none hover-shadow transition">
                                <span className="display-4 d-block mb-2">🗺️</span>
                                <span className="text-dark fw-bold">Journeys</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link href="/admin-dashboard" className="card bg-light border-0 p-4 text-center text-decoration-none hover-shadow transition">
                                <span className="display-4 d-block mb-2">🛡️</span>
                                <span className="text-dark fw-bold">Admin</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div> */}

        </div>
    );
}
