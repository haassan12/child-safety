"use client";

import { useEffect, useState } from "react";
import { getParentDashboard, addChild, linkChild, updateChild, unlinkChild } from "@/app/services/api";
import { ParentDashboardResponse } from "@/app/types/dashboard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileModal from "../components/ProfileModal";

export default function ParentDashboard() {
    const [data, setData] = useState<ParentDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    const [selectedChild, setSelectedChild] = useState<any>(null);

    // Add Child State
    const [showAddChild, setShowAddChild] = useState(false);
    const [isLinking, setIsLinking] = useState(false); // Toggle between Create and Link
    const [childForm, setChildForm] = useState({ name: "", email: "", password: "" });
    const [linkEmail, setLinkEmail] = useState("");
    const [formMessage, setFormMessage] = useState({ type: "", text: "" });

    const [sosPopup, setSosPopup] = useState<{ show: boolean; alert: any }>({ show: false, alert: null });
    const [lastAlertId, setLastAlertId] = useState<number | null>(null);
    const [dismissedAlertId, setDismissedAlertId] = useState<number | null>(null); // Track dismissed alert

    // Edit Child State
    const [editChild, setEditChild] = useState<any>(null);
    const [editChildForm, setEditChildForm] = useState({ name: "", email: "" });
    const [editChildMessage, setEditChildMessage] = useState({ type: "", text: "" });

    const fetchDashboard = async () => {
        try {
            const res = await getParentDashboard();
            setData(res);

            // Check for new SOS alert
            const latest = res.latest_alert;
            if (latest && latest.id !== lastAlertId) {
                if (lastAlertId !== null) { // Don't popup on initial load
                    setSosPopup({ show: true, alert: latest });
                    // Play Notification Sound
                    new Audio('/sos_sound.mp3').play().catch(() => { });
                }
                setLastAlertId(latest.id);
            } else if (latest) {
                setLastAlertId(latest.id);
            }

        } catch (err: any) {
            console.error("Dashboard Error:", err);
            if (err.response && err.response.status === 403) {
                sessionStorage.clear();
                router.push('/login');
                return;
            }
            setData({
                total_children: 0,
                active_journeys: 0,
                completed_journeys: 0,
                sos_alerts: 0,
                children: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Role check
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
            router.push("/login"); // Not logged in
            return;
        }
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.role !== "parent") {
            // Wrong role. Redirect appropriately.
            if (user.role === "child") router.push("/child-dashboard");
            else if (user.role === "admin") router.push("/admin-dashboard");
            else router.push("/login");
            return;
        }

        fetchDashboard();

        // Auto-Refresh every 5 seconds
        const interval = setInterval(fetchDashboard, 5000);
        return () => clearInterval(interval);
    }, [lastAlertId, router]);

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormMessage({ type: "", text: "" });
        try {
            if (isLinking) {
                await linkChild({ email: linkEmail });
                setFormMessage({ type: "success", text: "Child linked successfully!" });
            } else {
                await addChild(childForm);
                setFormMessage({ type: "success", text: "Child created successfully!" });
            }

            setChildForm({ name: "", email: "", password: "" });
            setLinkEmail("");
            fetchDashboard(); // Refresh stats
            setTimeout(() => setShowAddChild(false), 1500);
        } catch (err: any) {
            setFormMessage({ type: "error", text: err.response?.data?.message || "Failed to add child" });
        }
    };

    const openEditChildModal = (child: any) => {
        setEditChild(child);
        setEditChildForm({ name: child.name, email: child.email });
        setEditChildMessage({ type: "", text: "" });
    };

    const handleEditChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editChild) return;
        setEditChildMessage({ type: "", text: "" });
        try {
            await updateChild(editChild.id, editChildForm);
            setEditChildMessage({ type: "success", text: "Child updated successfully!" });
            setTimeout(() => setEditChild(null), 1500);
            fetchDashboard();
        } catch (err: any) {
            setEditChildMessage({ type: "error", text: err.response?.data?.message || "Failed to update child" });
        }
    };

    const handleUnlinkChild = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to unlink ${name}? They will no longer be connected to your account.`)) return;
        try {
            await unlinkChild(id);
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to unlink child");
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

    return (
        <div className="min-h-screen bg-light position-relative">
            <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">👨‍👩‍👧 Parent Dashboard</span>
                    <div className="d-flex gap-2">
                        <button onClick={() => setShowProfile(true)} className="btn btn-outline-light btn-sm rounded-pill px-3">
                            👤 Profile
                        </button>
                        <button onClick={() => setShowAddChild(true)} className="btn btn-success btn-sm rounded-pill px-3 fw-bold">
                            + Add Child
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

            {/* SOS POPUP */}
            {sosPopup.show && sosPopup.alert && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-90" style={{ zIndex: 2000 }}>
                    <div className="card border-danger border-3 shadow-lg p-4 rounded-4 text-center bg-dark text-white animate-pulse" style={{ maxWidth: '450px' }}>
                        <div className="mb-3 text-danger display-1">🚨</div>
                        <h2 className="text-danger fw-bold mb-2">SOS ALERT!</h2>
                        <h4 className="fw-bold mb-3">{sosPopup.alert.child_name || "Your Child"}</h4>
                        <p className="fs-5 mb-3 px-3 bg-danger bg-opacity-25 py-2 rounded-3 border border-danger text-light">
                            "{sosPopup.alert.message}"
                        </p>

                        {/* Location Display */}
                        {sosPopup.alert.latitude && sosPopup.alert.longitude && (
                            <div className="bg-primary bg-opacity-10 p-3 rounded-3 mb-3 border border-primary border-opacity-25">
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                    <span className="fs-4">📍</span>
                                    <span className="fw-bold text-primary">Last Known Location</span>
                                </div>
                                <p className="text-light mb-2 small">{sosPopup.alert.location_address || 'Location captured'}</p>
                                <a
                                    href={`https://www.google.com/maps?q=${sosPopup.alert.latitude},${sosPopup.alert.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                                >
                                    🗺️ View on Map
                                </a>
                            </div>
                        )}

                        <div className="d-grid gap-2">
                            <button onClick={() => setSosPopup({ ...sosPopup, show: false })} className="btn btn-outline-light rounded-pill">
                                Dismiss / I'm Safe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container pb-5">

                <div className="card card-dark rounded-4 p-4 mb-4">
                    <h4 className="fw-bold mb-4">Overview</h4>
                    <div className="row g-4">
                        <div className="col-6 col-md-3">
                            <div className="bg-primary bg-opacity-10 p-4 rounded-4 text-center h-100">
                                <div className="fs-1 mb-2">👧</div>
                                <small className="text-light opacity-75">Children</small>
                                <h2 className="fw-bold mb-0 text-white">{data?.total_children || 0}</h2>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="bg-success bg-opacity-10 p-4 rounded-4 text-center h-100">
                                <div className="fs-1 mb-2">🚶</div>
                                <small className="text-light opacity-75">Active</small>
                                <h2 className="fw-bold mb-0 text-white">{data?.active_journeys || 0}</h2>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="bg-warning bg-opacity-10 p-4 rounded-4 text-center h-100">
                                <div className="fs-1 mb-2">✅</div>
                                <small className="text-light opacity-75">Done</small>
                                <h2 className="fw-bold mb-0 text-white">{data?.completed_journeys || 0}</h2>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="bg-danger bg-opacity-10 p-4 rounded-4 text-center h-100 border border-danger border-opacity-25">
                                <div className="fs-1 mb-2">🚨</div>
                                <small className="text-danger fw-bold">ALERTS</small>
                                <h2 className="fw-bold mb-0 text-danger">{data?.sos_alerts || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest SOS Alert Section - Dismissible */}
                {data?.latest_alert && data.latest_alert.id !== dismissedAlertId && (
                    <div className="card bg-danger bg-opacity-10 border border-danger rounded-4 p-4 mb-4 position-relative">
                        {/* X Button to Dismiss */}
                        <button
                            onClick={() => setDismissedAlertId(data.latest_alert.id)}
                            className="btn btn-sm btn-outline-danger rounded-circle position-absolute"
                            style={{ top: '10px', right: '10px', width: '32px', height: '32px', padding: 0 }}
                            title="Dismiss - Child is safe"
                        >
                            ✕
                        </button>

                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="fs-1">🚨</div>
                            <div>
                                <h5 className="text-danger fw-bold mb-0">Latest SOS Alert</h5>
                                <small className="text-light opacity-75">
                                    {new Date(data.latest_alert.created_at).toLocaleString()}
                                </small>
                            </div>
                        </div>
                        <div className="bg-dark bg-opacity-50 p-3 rounded-3 border border-danger border-opacity-50">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <strong className="text-white">{data.latest_alert.child_name || "Child"}</strong>
                                    <p className="text-light mb-0 mt-1">"{data.latest_alert.message}"</p>
                                </div>
                                <span className="badge bg-danger fs-6">SOS</span>
                            </div>

                            {/* Location Info */}
                            {data.latest_alert.latitude && data.latest_alert.longitude && (
                                <div className="d-flex align-items-center justify-content-between bg-primary bg-opacity-10 p-2 rounded-3 border border-primary border-opacity-25">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="fs-5">📍</span>
                                        <span className="text-light small">{data.latest_alert.location_address || 'Location captured'}</span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${data.latest_alert.latitude},${data.latest_alert.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                                    >
                                        🗺️ Map
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* My Children List */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <h4 className="fw-bold mb-4">My Children</h4>
                    {data?.children && data.children.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-dark table-hover mb-0 bg-transparent">
                                <thead>
                                    <tr>
                                        <th className="bg-transparent text-secondary small pt-3 pb-3">NAME</th>
                                        <th className="bg-transparent text-secondary small pt-3 pb-3">EMAIL</th>
                                        <th className="bg-transparent text-secondary small pt-3 pb-3">JOINED</th>
                                        <th className="bg-transparent text-secondary small pt-3 pb-3 text-end">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.children.map((child: any) => (
                                        <tr key={child.id}>
                                            <td className="bg-transparent align-middle py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold" style={{ width: '40px', height: '40px' }}>
                                                        {child.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-white">{child.name}</div>
                                                        <div className="small text-secondary">Child Account</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="bg-transparent align-middle text-light opacity-75">{child.email}</td>
                                            <td className="bg-transparent align-middle text-secondary small">
                                                {new Date(child.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="bg-transparent align-middle text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button
                                                        onClick={() => setSelectedChild(child)}
                                                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                    >
                                                        👁️
                                                    </button>
                                                    <button
                                                        onClick={() => openEditChildModal(child)}
                                                        className="btn btn-sm btn-warning rounded-pill px-3"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnlinkChild(child.id, child.name)}
                                                        className="btn btn-sm btn-danger rounded-pill px-3"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-secondary">
                            <div className="display-1 mb-3 opacity-25">👶</div>
                            <p className="mb-3">No children added yet.</p>
                            <button onClick={() => setShowAddChild(true)} className="btn btn-outline-success btn-sm rounded-pill px-4">
                                + Add Your First Child
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <h4 className="fw-bold mb-4">Quick Actions</h4>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <Link href="/parent-journey" className="btn btn-primary btn-premium w-100 py-3 rounded-4 fw-bold shadow-sm text-decoration-none">
                                👁️ Track Journeys
                            </Link>
                        </div>
                        <div className="col-md-4">
                            <button onClick={() => setShowAddChild(true)} className="btn btn-success w-100 py-3 rounded-4 fw-bold shadow-sm text-white border-0">
                                ➕ Add New Child
                            </button>
                        </div>
                        <div className="col-md-4">
                            <Link href="/parent-journey" className="btn btn-danger w-100 py-3 rounded-4 fw-bold shadow-sm text-decoration-none">
                                🔔 View Alerts
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="card bg-white border-0 shadow-sm rounded-4 p-4">
                    <h5 className="text-dark fw-bold mb-3">Navigation</h5>
                    <div className="d-flex gap-2">
                        <Link href="/parent-journey" className="btn btn-light rounded-pill px-4">All Journeys →</Link>
                        <Link href="/" className="btn btn-light rounded-pill px-4">Home →</Link>
                    </div>
                </div>
            </div>

            {/* Add Child Modal Overlay */}
            {showAddChild && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-90" style={{ zIndex: 1050, backdropFilter: 'blur(5px)' }}>
                    <div className="card card-dark p-4 rounded-4 shadow-lg w-100 border border-secondary border-opacity-25" style={{ maxWidth: '400px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0 text-white">Add Child Account</h4>
                            <button onClick={() => setShowAddChild(false)} className="btn btn-sm btn-dark rounded-circle border-0 text-secondary fs-5">✕</button>
                        </div>

                        {formMessage.text && (
                            <div className={`alert ${formMessage.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 small rounded-3 text-center mb-4`}>
                                {formMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleAddChild}>
                            <div className="d-flex justify-content-center gap-2 mb-4">
                                <button type="button" onClick={() => setIsLinking(false)} className={`btn btn-sm rounded-pill px-3 fw-bold ${!isLinking ? 'btn-light' : 'btn-outline-secondary'}`}>
                                    Create New
                                </button>
                                <button type="button" onClick={() => setIsLinking(true)} className={`btn btn-sm rounded-pill px-3 fw-bold ${isLinking ? 'btn-light' : 'btn-outline-secondary'}`}>
                                    Link Existing
                                </button>
                            </div>

                            {isLinking ? (
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">CHILD'S EMAIL</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                                        required
                                        placeholder="e.g. child@example.com"
                                        value={linkEmail}
                                        onChange={e => setLinkEmail(e.target.value)}
                                    />
                                    <div className="form-text text-secondary small mt-2">
                                        Enter the email the child used to sign up. Detailed instructions will be sent to them.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">FULL NAME</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                                            required
                                            placeholder="e.g. Timmy Smith"
                                            value={childForm.name}
                                            onChange={e => setChildForm({ ...childForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">EMAIL ADDRESS</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                                            required
                                            placeholder="e.g. timmy@example.com"
                                            value={childForm.email}
                                            onChange={e => setChildForm({ ...childForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary">PASSWORD</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            value={childForm.password}
                                            onChange={e => setChildForm({ ...childForm, password: e.target.value })}
                                        />
                                        <div className="form-text text-secondary small mt-1">Must be at least 6 characters.</div>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-success w-100 rounded-pill fw-bold py-2 shadow-sm">
                                {isLinking ? "Link Child Account" : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedChild && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-90" style={{ zIndex: 1060, backdropFilter: 'blur(5px)' }}>
                    <div className="card card-dark p-0 rounded-4 shadow-lg w-100 border border-secondary border-opacity-25 overflow-hidden" style={{ maxWidth: '380px' }}>

                        <div className="bg-primary bg-opacity-10 p-4 text-center border-bottom border-secondary border-opacity-10">
                            <div className="bg-primary bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center text-primary fw-bold mb-3 shadow-sm" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                {selectedChild.name.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="fw-bold text-white mb-0">{selectedChild.name}</h4>
                            <span className="badge bg-primary bg-opacity-25 text-primary rounded-pill mt-2 px-3">Child Account</span>
                        </div>

                        <div className="p-4">
                            <div className="mb-3">
                                <label className="small text-secondary fw-bold d-block mb-1">EMAIL</label>
                                <div className="text-white fs-6">{selectedChild.email}</div>
                            </div>

                            <div className="mb-3">
                                <label className="small text-secondary fw-bold d-block mb-1">JOINED ON</label>
                                <div className="text-white fs-6">{new Date(selectedChild.created_at).toLocaleDateString()}</div>
                            </div>

                            <div className="mb-4">
                                <label className="small text-secondary fw-bold d-block mb-1">PASSWORD</label>
                                <div className="text-secondary small fst-italic">Hidden for security</div>
                            </div>

                            <button onClick={() => setSelectedChild(null)} className="btn btn-outline-light w-100 rounded-pill">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Child Modal */}
            {editChild && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setEditChild(null)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content bg-dark text-white border-secondary rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">✏️ Edit Child</h5>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setEditChild(null)}>✕</button>
                            </div>

                            {editChildMessage.text && (
                                <div className={`alert ${editChildMessage.type === "success" ? "alert-success" : "alert-danger"} py-2 small`}>
                                    {editChildMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleEditChild}>
                                <div className="mb-3">
                                    <label className="form-label small text-light opacity-75">Name</label>
                                    <input
                                        type="text"
                                        className="form-control bg-dark text-white border-secondary rounded-pill"
                                        value={editChildForm.name}
                                        onChange={e => setEditChildForm({ ...editChildForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-light opacity-75">Email</label>
                                    <input
                                        type="email"
                                        className="form-control bg-dark text-white border-secondary rounded-pill"
                                        value={editChildForm.email}
                                        onChange={e => setEditChildForm({ ...editChildForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm">
                                    Update Child
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
