"use client";

import { useState, useEffect } from "react";
import ChildJourneyAPI from "../services/childJourneyApi";
import { Journey } from "../types/journey";
import Link from "next/link";

export default function ChildJourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [file, setFile] = useState<File | null>(null);

  // Fetch journeys without showing full-page loading
  const fetchJourneys = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await ChildJourneyAPI.getChildJourneys();
      setJourneys(res);

      const active = res.find(j => j.status === "started" || j.status === "active");
      setActiveJourneyId(active ? active.id : null);

    } catch (err) {
      console.error("Fetch Error:", err);
      setJourneys([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchJourneys(true); }, []); // Only show loader on initial load

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleStart = async () => {
    setButtonLoading("start");
    try {
      await ChildJourneyAPI.startJourney({ start_location: "Home", end_location: "School" });
      showMessage("success", "Journey started!");
      fetchJourneys();
    } catch (err: any) {
      console.error("Start Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to start";
      showMessage("error", errMsg);
    } finally { setButtonLoading(""); }
  };

  const handleStop = async () => {
    if (!activeJourneyId) return showMessage("error", "No active journey found");

    setButtonLoading("stop");
    try {
      await ChildJourneyAPI.stopJourney();
      showMessage("success", "Stopped!");
      fetchJourneys();
    } catch (err: any) {
      console.error("Stop Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to stop";
      showMessage("error", errMsg);
    } finally { setButtonLoading(""); }
  };

  const handleSOS = async () => {
    // SOS allowed 24/7 now
    setButtonLoading("sos");
    try {
      await ChildJourneyAPI.sendSOS({ journey_id: activeJourneyId || undefined, message: "Help!" });
      showMessage("success", "SOS Alert Sent!");
    } catch (err: any) {
      console.error("SOS Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to send SOS";
      showMessage("error", errMsg);
    } finally { setButtonLoading(""); }
  };

  const handleUpload = async () => {
    if (!activeJourneyId) return showMessage("error", "No active journey");
    if (!file) return showMessage("error", "Select file first");

    setButtonLoading("upload");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await ChildJourneyAPI.uploadDocument(activeJourneyId, formData);
      showMessage("success", "Uploaded!");
      setFile(null);
      fetchJourneys();
    } catch (err: any) {
      console.error("Upload Error:", err);
      showMessage("error", err.response?.data?.message || "Failed to upload");
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
          <span className="navbar-brand mb-0 h1 fw-bold">🗺️ My Journeys</span>
          <Link href="/child-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">← Dashboard</Link>
        </div>
      </nav>

      <div className="container pb-5">

        {/* Alerts */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-4 border-0 mb-4 text-center`}>
            {message.text}
          </div>
        )}
{/* 
        Actions Card
        <div className="card card-dark rounded-4 p-4 mb-4">
          <h4 className="fw-bold mb-4">Quick Actions</h4>
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-3">
              <button onClick={handleStart} disabled={buttonLoading === "start" || !!activeJourneyId}
                className="btn btn-success w-100 py-3 rounded-4 fw-bold shadow-sm disabled:opacity-50">
                {buttonLoading === "start" ? "..." : activeJourneyId ? "🚶 Active" : "🚀 Start"}
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button onClick={handleStop} disabled={buttonLoading === "stop" || !activeJourneyId}
                className="btn btn-warning w-100 py-3 rounded-4 fw-bold shadow-sm text-dark disabled:opacity-50">
                {buttonLoading === "stop" ? "..." : "🛑 Stop"}
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button onClick={handleSOS} disabled={buttonLoading === "sos"}
                className="btn btn-danger w-100 py-3 rounded-4 fw-bold shadow-sm disabled:opacity-50">
                {buttonLoading === "sos" ? "..." : "🆘 SOS"}
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button onClick={handleUpload} disabled={buttonLoading === "upload" || !activeJourneyId}
                className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-sm disabled:opacity-50">
                {buttonLoading === "upload" ? "..." : "📤 Upload"}
              </button>
            </div>
          </div>
          <div className="input-group">
            <input type="file" className="form-control form-control-dark rounded-pill"
              onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={!activeJourneyId} />
          </div>
        </div> */}

        {/* History List */}
        <div className="card card-dark rounded-4 p-4">
          <h4 className="fw-bold mb-4">Journey History</h4>
          {journeys.length === 0 ? (
            <div className="text-center py-5 text-secondary">No journeys yet</div>
          ) : (
            <div className="row g-3">
              {journeys.map((j) => (
                <div key={j.id} className="col-md-6">
                  <div className={`bg-secondary bg-opacity-10 p-3 rounded-4 h-100 border ${j.status === 'started' ? 'border-success' : 'border-secondary'} border-opacity-25`}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className={`badge rounded-pill ${j.status === "started" ? "bg-success" :
                        j.status === "completed" ? "bg-info" : "bg-secondary"
                        }`}>
                        {j.status === "started" ? "🚶 Active" : j.status === "completed" ? "✅ Done" : "🛑 Stopped"}
                      </span>
                      <small className="text-white opacity-50">ID: {j.id}</small>
                    </div>
                    <div className="mb-2 text-white"><span className="text-success me-2">📍</span> {j.start_location}</div>
                    <div className="mb-2 text-white"><span className="text-danger me-2">🏁</span> {j.end_location}</div>
                    <div className="small text-white opacity-50 border-top border-secondary border-opacity-25 pt-2 mt-2">
                      Started: {j.started_at}
                    </div>
                    {j.document_path && (
                      <div className="mt-2 text-end">
                        <a href={`http://localhost:8000/storage/${j.document_path}`} target="_blank" className="btn btn-sm btn-outline-info rounded-pill">
                          📎 View File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
