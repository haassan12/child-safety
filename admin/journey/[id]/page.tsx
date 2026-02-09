"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/app/services/api";
import Link from "next/link";

export default function AdminJourneyDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [journey, setJourney] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Edit form state
    const [editForm, setEditForm] = useState({
        start_location: "",
        end_location: "",
        duration_minutes: 30,
        status: ""
    });

    useEffect(() => {
        if (id) {
            fetchJourneyDetails(Number(id));
        }
    }, [id]);

    const fetchJourneyDetails = async (journeyId: number) => {
        try {
            const res = await API.get(`/admin/journey/${journeyId}`);
            const data = res.data.data;
            setJourney(data);
            setEditForm({
                start_location: data.start_location || "",
                end_location: data.end_location || "",
                duration_minutes: data.duration_minutes || 30,
                status: data.status || "scheduled"
            });
        } catch (err: any) {
            console.error("Error fetching journey:", err);
            setMessage({ type: "error", text: "Failed to load journey" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await API.put(`/admin/journey/${id}`, editForm);

            // Update the journey state directly with the updated data
            const updatedJourney = res.data.data || { ...journey, ...editForm };
            setJourney(updatedJourney);

            // Also update editForm to match
            setEditForm({
                start_location: updatedJourney.start_location || "",
                end_location: updatedJourney.end_location || "",
                duration_minutes: updatedJourney.duration_minutes || 30,
                status: updatedJourney.status || "scheduled"
            });

            setMessage({ type: "success", text: "Journey updated successfully!" });
        } catch (err: any) {
            console.error("Update error:", err);
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to update journey" });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading...</div>;
    if (!journey) return <div className="p-5 text-center">Journey not found</div>;

    return (
        <div className="min-h-screen bg-light">
            <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">🛡️ Admin View: Journey #{journey.id}</span>
                    <Link href="/admin-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">← Dashboard</Link>
                </div>
            </nav>

            <div className="container pb-5">

                {/* Message Alert */}
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-3 mb-4`}>
                        {message.text}
                    </div>
                )}

                {/* Journey Info Card */}
                <div className="card card-dark rounded-4 p-4 mb-4">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h2 className="fw-bold text-white mb-2">
                                {journey.start_location} <span className="text-secondary">to</span> {journey.end_location}
                            </h2>
                            <span className={`badge rounded-pill fs-6 ${journey.status === 'started' ? 'bg-success' : journey.status === 'completed' ? 'bg-info' : journey.status === 'scheduled' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                {journey.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-end">
                            <div className="text-secondary small fw-bold">CHILD</div>
                            <div className="text-white fs-5">{journey.child_name || `Child #${journey.child_id}`}</div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Timeline Card */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h5 className="fw-bold mb-3">Timeline</h5>
                            <div className="mb-3">
                                <label className="small text-secondary fw-bold d-block">STARTED AT</label>
                                <div className="fs-5">{new Date(journey.created_at).toLocaleString()}</div>
                            </div>
                            {journey.ended_at && (
                                <div className="mb-3">
                                    <label className="small text-secondary fw-bold d-block">ENDED AT</label>
                                    <div className="fs-5">{new Date(journey.ended_at).toLocaleString()}</div>
                                </div>
                            )}
                            {journey.duration_minutes && (
                                <div className="mb-3">
                                    <label className="small text-secondary fw-bold d-block">DURATION</label>
                                    <div className="fs-5">{journey.duration_minutes} minutes</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Form Card */}
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h5 className="fw-bold mb-4">✏️ Edit Journey</h5>
                            <form onSubmit={handleUpdate}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary">START LOCATION</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3 py-2"
                                            value={editForm.start_location}
                                            onChange={e => setEditForm({ ...editForm, start_location: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary">END LOCATION</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3 py-2"
                                            value={editForm.end_location}
                                            onChange={e => setEditForm({ ...editForm, end_location: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary">DURATION (MINUTES)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control rounded-3 py-2"
                                            value={editForm.duration_minutes}
                                            onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary">STATUS</label>
                                        <select
                                            className="form-select rounded-3 py-2"
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        >
                                            <option value="scheduled">Scheduled</option>
                                            <option value="started">Started</option>
                                            <option value="completed">Completed</option>
                                            <option value="stopped">Stopped</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="btn btn-primary rounded-pill fw-bold px-4 py-2 mt-4"
                                >
                                    {updating ? "Updating..." : "Update Journey"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
