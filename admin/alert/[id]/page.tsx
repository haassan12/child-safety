"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/app/services/api";
import Link from "next/link";

export default function AdminAlertDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [alert, setAlert] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchAlertDetails(Number(id));
        }
    }, [id]);

    const fetchAlertDetails = async (alertId: number) => {
        try {
            const res = await API.get(`/admin/alert/${alertId}`);
            setAlert(res.data.data);
        } catch (err: any) {
            console.error("Error fetching alert:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading...</div>;
    if (!alert) return <div className="p-5 text-center">Alert not found</div>;

    return (
        <div className="min-h-screen bg-light">
            <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">🚨 Admin View: Alert #{alert.id}</span>
                    <Link href="/admin-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">← Dashboard</Link>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="card card-dark rounded-4 p-4 mb-4 border border-danger border-opacity-50">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h2 className="fw-bold text-danger mb-2">SOS ALERT</h2>
                            <p className="lead text-white mb-0">{alert.message}</p>
                        </div>
                        <div className="text-end">
                            <div className="text-secondary small fw-bold">CHILD</div>
                            <div className="text-white fs-5">{alert.child_name || `Child #${alert.child_id}`}</div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h5 className="fw-bold mb-3">Details</h5>
                            <div className="mb-3">
                                <label className="small text-secondary fw-bold d-block">TIME</label>
                                <div className="fs-5">{new Date(alert.created_at).toLocaleString()}</div>
                            </div>
                            <div className="mb-3">
                                <label className="small text-secondary fw-bold d-block">LOCATION</label>
                                <div className="fs-5">{alert.location || "Unknown"}</div>
                            </div>
                            {alert.journey_id && (
                                <div className="mt-4">
                                    <Link href={`/admin/journey/${alert.journey_id}`} className="btn btn-outline-primary w-100">
                                        View Associated Journey
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-danger bg-opacity-10 d-flex align-items-center justify-content-center text-center">
                            <div>
                                <div className="display-1 opacity-25 mb-3 text-danger">📍</div>
                                <h5 className="opacity-50 text-danger">Exact Location Map</h5>
                                <p className="small text-danger opacity-75">Map integration pending.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
