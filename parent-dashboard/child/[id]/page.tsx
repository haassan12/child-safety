"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getChildDetails } from "@/app/services/api";
import ParentJourneyAPI from "@/app/services/parentJourneyApi";
import Link from "next/link";

export default function ChildDetailPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const [child, setChild] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [recentJourneys, setRecentJourneys] = useState<any[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // Add Journey State
    const [showAddJourney, setShowAddJourney] = useState(false);
    const [newJourney, setNewJourney] = useState({ start_location: "", end_location: "", duration_minutes: 60 });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchChildDetails(Number(id));
        }
    }, [id]);

    const handleAddJourney = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await ParentJourneyAPI.createJourney({
                child_id: Number(params.id),
                ...newJourney
            });
            setShowAddJourney(false);
            setNewJourney({ start_location: "", end_location: "", duration_minutes: 60 });
            alert("Journey Scheduled Successfully!");
            fetchChildDetails(Number(params.id));
        } catch (err: any) {
            console.error("Add Journey Try:", err);
            alert("Failed to schedule journey");
        } finally {
            setFormLoading(false);
        }
    };

    const fetchChildDetails = async (childId: number) => {
        try {
            const data = await getChildDetails(childId);
            setChild(data.profile);
            setStats(data.stats);
            setRecentJourneys(data.recent_journeys);
            setRecentAlerts(data.recent_alerts);
        } catch (err: any) {
            console.error("Error fetching child details:", err);
            setMessage("Failed to load child details. You may not be authorized.");
            setTimeout(() => router.push("/parent-dashboard"), 3000);
        } finally {
            setLoading(false);
        }
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

    if (!child) return <div className="p-5 text-center">Child not found</div>;

    return (
        <div className="min-h-screen bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">👶 {child.name}'s Profile</span>
                    <Link href="/parent-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">← Dashboard</Link>
                </div>
            </nav>

            <div className="container pb-5">

                {/* Actions */}
                <div className="d-flex justify-content-end mb-4">
                    <button onClick={() => setShowAddJourney(true)} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                        📅 Schedule Journey
                    </button>
                </div>

                {/* Add Journey Modal */}
                {showAddJourney && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }}>
                        <div className="card shadow-lg p-4 rounded-4" style={{ maxWidth: '500px', width: '100%' }}>
                            <h4 className="fw-bold mb-3">📅 Plan a Journey</h4>
                            <form onSubmit={handleAddJourney}>
                                <div className="mb-3">
                                    <label className="form-label">Start Location</label>
                                    <input type="text" className="form-control" required
                                        value={newJourney.start_location} onChange={e => setNewJourney({ ...newJourney, start_location: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">End Location</label>
                                    <input type="text" className="form-control" required
                                        value={newJourney.end_location} onChange={e => setNewJourney({ ...newJourney, end_location: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Duration (Minutes)</label>
                                    <input type="number" className="form-control" required min="1"
                                        value={newJourney.duration_minutes} onChange={e => setNewJourney({ ...newJourney, duration_minutes: parseInt(e.target.value) })} />
                                    <small className="text-muted">Expected duration. Auto-SOS will trigger if exceeded.</small>
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddJourney(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                        {formLoading ? "Scheduling..." : "Schedule Journey"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {message && <div className="alert alert-danger text-center mb-4">{message}</div>}

                {/* Profile Header */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <div className="d-flex align-items-center gap-4">
                        <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold shadow-sm" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                            {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="fw-bold text-white mb-0">{child.name}</h2>
                            <p className="text-light opacity-75 mb-0">{child.email}</p>
                            <span className="badge bg-success rounded-pill mt-2">Active Child Account</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="row g-4 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-3 text-center">
                            <div className="display-4 mb-2">🚶</div>
                            <small className="text-secondary fw-bold">TOTAL JOURNEYS</small>
                            <h3 className="fw-bold mb-0 text-dark">{stats?.total_journeys || 0}</h3>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-3 text-center bg-success bg-opacity-10">
                            <div className="display-4 mb-2">📍</div>
                            <small className="text-success fw-bold">ACTIVE NOW</small>
                            <h3 className="fw-bold mb-0 text-success">{stats?.active_journeys || 0}</h3>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-3 text-center">
                            <div className="display-4 mb-2">✅</div>
                            <small className="text-secondary fw-bold">COMPLETED</small>
                            <h3 className="fw-bold mb-0 text-dark">{stats?.completed_journeys || 0}</h3>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-3 text-center bg-danger bg-opacity-10">
                            <div className="display-4 mb-2">🚨</div>
                            <small className="text-danger fw-bold">ALERTS</small>
                            <h3 className="fw-bold mb-0 text-danger">{stats?.alerts || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Recent Journeys */}
                    <div className="col-md-7">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                                <h5 className="fw-bold">🗺️ Recent Journeys</h5>
                            </div>
                            <div className="card-body px-4 pb-4">
                                {recentJourneys.length === 0 ? (
                                    <p className="text-secondary text-center py-4">No journeys recorded yet.</p>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {recentJourneys.map((j) => (
                                            <div key={j.id} className="list-group-item px-0 py-3 border-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-dark">{j.start_location} → {j.end_location}</div>
                                                        <small className="text-secondary">{new Date(j.created_at).toLocaleString()}</small>
                                                    </div>
                                                    <span className={`badge rounded-pill ${j.status === 'started' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {j.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="col-md-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                                <h5 className="fw-bold text-danger">🚨 SOS Alerts</h5>
                            </div>
                            <div className="card-body px-4 pb-4">
                                {recentAlerts.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="display-1 opacity-25">🛡️</div>
                                        <p className="text-success fw-bold mt-2">No alerts. Safe!</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {recentAlerts.map((a) => (
                                            <div key={a.id} className="list-group-item px-0 py-3 border-light">
                                                <div className="d-flex align-items-start gap-3">
                                                    <span className="fs-3">⚠️</span>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-bold text-danger">{a.message || "SOS Alert"}</div>
                                                        <small className="text-secondary">
                                                            🕒 {new Date(a.created_at).toLocaleString()}
                                                        </small>
                                                        {/* Location Display */}
                                                        {a.latitude && a.longitude && (
                                                            <div className="d-flex align-items-center gap-2 mt-2 bg-light p-2 rounded-3">
                                                                <span>📍</span>
                                                                <span className="small text-dark flex-grow-1">{a.location_address || 'Location captured'}</span>
                                                                <a
                                                                    href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-primary btn-sm rounded-pill px-2 py-0"
                                                                    style={{ fontSize: '0.7rem' }}
                                                                >
                                                                    Map
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
