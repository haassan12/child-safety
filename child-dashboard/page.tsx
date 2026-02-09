"use client";

import { useEffect, useState } from "react";
import { getChildDashboard } from "../services/api";
import ChildJourneyAPI from "../services/childJourneyApi";
import { ChildDashboardResponse } from "../types/dashboard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileModal from "../components/ProfileModal";

export default function ChildDashboard() {
    const [data, setData] = useState<ChildDashboardResponse | null>(null);
    const [activeJourneyId, setActiveJourneyId] = useState<number | null>(null);
    const [scheduledJourneys, setScheduledJourneys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [buttonLoading, setButtonLoading] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    const fetchData = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            // 1. Fetch Dashboard Stats
            try {
                const dashboardRes = await getChildDashboard();
                setData(dashboardRes);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }

            // 2. Fetch Journeys
            try {
                const journeys = await ChildJourneyAPI.getChildJourneys();

                // journeys is Journey[] directly from the service
                if (Array.isArray(journeys)) {
                    // Find active journey
                    const active = journeys.find((j: any) => j.status === "started" || j.status === "active");
                    setActiveJourneyId(active ? active.id : null);

                    // Find scheduled journeys
                    const scheduled = journeys.filter((j: any) => j.status === "scheduled");
                    setScheduledJourneys(scheduled);
                }
            } catch (error) {
                console.error("Failed to fetch journeys", error);
            }

        } catch (err: any) {
            console.error("Dashboard Global Error:", err);
            if (err.response && err.response.status === 403) {
                const user = JSON.parse(sessionStorage.getItem("user") || "{}");
                if (user.role === 'parent') router.push('/parent-dashboard');
                else if (user.role === 'admin') router.push('/admin-dashboard');
                else router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Role check before fetch
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
            router.push("/login");
            return;
        }
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.role !== "child") {
            if (user.role === "parent") router.push("/parent-dashboard");
            else if (user.role === "admin") router.push("/admin-dashboard");
            else router.push("/login"); // Should not happen
            return;
        }

        fetchData(true); // Only show loading on initial page load
    }, [router]);

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleStart = async (journeyId?: number) => {
        setButtonLoading(journeyId ? `start-${journeyId}` : "start");
        try {
            if (journeyId) {
                // Start a scheduled journey
                await ChildJourneyAPI.startJourney({ journey_id: journeyId });
            } else {
                // Start a new ad-hoc journey
                await ChildJourneyAPI.startJourney({ start_location: "Home", end_location: "School" });
            }
            showMessage("success", "Journey started successfully!");
            fetchData(); // No loader on refresh
        } catch (err: any) {
            console.error("Start Error:", err);
            if (err.response && err.response.status === 401) {
                sessionStorage.clear();
                router.push('/login');
                return;
            }
            const errMsg = err.response?.data?.message || err.message || "Failed to start journey";
            showMessage("error", errMsg);
        } finally { setButtonLoading(""); }
    };

    const handleStop = async () => {
        if (!activeJourneyId) return showMessage("error", "No active journey found locally");

        setButtonLoading("stop");
        try {
            await ChildJourneyAPI.stopJourney();
            showMessage("success", "Journey stopped successfully!");
            fetchData(); // No loader on refresh
        } catch (err: any) {
            console.error("Stop Error:", err);
            if (err.response && err.response.status === 401) {
                sessionStorage.clear();
                router.push('/login');
                return;
            }
            const errMsg = err.response?.data?.message || err.message || "Failed to stop journey";
            showMessage("error", errMsg);
        } finally { setButtonLoading(""); }
    };

    const handleSOS = async () => {
        // SOS is now allowed 24/7
        setButtonLoading("sos");
        try {
            // journey_id can be null if not started
            await ChildJourneyAPI.sendSOS({ journey_id: activeJourneyId || undefined, message: "Help! I need assistance!" });
            showMessage("success", "SOS Alert Sent!");
        } catch (err: any) {
            console.error("SOS Error:", err);
            if (err.response && err.response.status === 401) {
                sessionStorage.clear();
                router.push('/login');
                return;
            }
            const errMsg = err.response?.data?.message || err.message || "Failed to send SOS";
            showMessage("error", errMsg);
        } finally { setButtonLoading(""); }
    };

    if (loading) {
        return (
            <div className="min-h-screen d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">👋 Child Dashboard</span>
                    <div className="d-flex gap-2">
                        <button onClick={() => setShowProfile(true)} className="btn btn-outline-light btn-sm rounded-pill px-3">
                            👤 Profile
                        </button>
                        <button onClick={() => {
                            sessionStorage.clear();
                            window.location.href = '/login';
                        }} className="btn btn-outline-light btn-sm rounded-pill px-3">Log Out</button>
                    </div>
                </div>
            </nav>

            {showProfile && currentUser && (
                <ProfileModal
                    user={currentUser}
                    onClose={() => setShowProfile(false)}
                    onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
                />
            )}

            <div className="container pb-5">
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-4 border-0 mb-4 text-center`}>
                        {message.text}
                    </div>
                )}

                {/* Scheduled Journeys Section */}
                {scheduledJourneys.length > 0 && !activeJourneyId && (
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-primary bg-opacity-10">
                        <h5 className="fw-bold text-primary mb-3">📅 Scheduled Journeys</h5>
                        <div className="list-group">
                            {scheduledJourneys.map(j => (
                                <div key={j.id} className="list-group-item border-0 d-flex justify-content-between align-items-center rounded-3 mb-2 shadow-sm">
                                    <div>
                                        <strong>{j.start_location} ➝ {j.end_location}</strong>
                                        <div className="small text-muted">
                                            {j.duration_minutes ? `Duration: ${j.duration_minutes} mins` : ''}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleStart(j.id)}
                                        disabled={!!buttonLoading}
                                        className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                                    >
                                        {buttonLoading === `start-${j.id}` ? "Starting..." : "🚀 Start Now"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Section */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <h4 className="fw-bold mb-4">My Stats</h4>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="bg-primary bg-opacity-10 p-4 rounded-4 text-center">
                                <div className="display-4 mb-2">🚶</div>
                                <small className="text-light opacity-75">Status</small>
                                <h3 className="fw-bold mb-0 text-white">{data?.active_journey_status || "None"}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-success bg-opacity-10 p-4 rounded-4 text-center">
                                <div className="display-4 mb-2">📍</div>
                                <small className="text-light opacity-75">Journeys</small>
                                <h3 className="fw-bold mb-0 text-white">{data?.total_journeys || 0}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-danger bg-opacity-10 p-4 rounded-4 text-center">
                                <div className="display-4 mb-2">🚨</div>
                                <small className="text-light opacity-75">Alerts</small>
                                <h3 className="fw-bold mb-0 text-white">{data?.alerts || 0}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <h4 className="fw-bold mb-4">Quick Actions</h4>
                    <div className="row g-3">
                        <div className="col-6 col-md-3">
                            <button onClick={() => handleStart()} disabled={buttonLoading === "start" || !!activeJourneyId}
                                className="btn btn-success w-100 py-3 rounded-4 fw-bold shadow-sm h-100 disabled:opacity-50">
                                {buttonLoading === "start" ? "Starting..." : activeJourneyId ? "🚶 Active" : "🚀 Start"}
                            </button>
                        </div>
                        <div className="col-6 col-md-3">
                            <button onClick={handleStop} disabled={buttonLoading === "stop" || !activeJourneyId}
                                className="btn btn-warning w-100 py-3 rounded-4 fw-bold shadow-sm h-100 text-dark disabled:opacity-50">
                                {buttonLoading === "stop" ? "Stopping..." : "🛑 Stop"}
                            </button>
                        </div>
                        <div className="col-6 col-md-3">
                            <button onClick={handleSOS} disabled={buttonLoading === "sos"}
                                className="btn btn-danger w-100 py-3 rounded-4 fw-bold shadow-sm h-100 disabled:opacity-50">
                                {buttonLoading === "sos" ? "..." : "🆘 SOS"}
                            </button>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link href="/child-journey" className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-sm h-100 d-flex align-items-center justify-content-center">
                                📜 History
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="card bg-white border-0 shadow-sm rounded-4 p-4">
                    <h5 className="text-dark fw-bold mb-3">Navigation</h5>
                    <div className="d-flex gap-2">
                        <Link href="/child-journey" className="btn btn-light rounded-pill px-4">My Journeys →</Link>
                        <Link href="/" className="btn btn-light rounded-pill px-4">Home →</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
