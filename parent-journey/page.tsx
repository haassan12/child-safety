"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ParentJourneyAPI from "../services/parentJourneyApi";
import { getParentDashboard } from "../services/api";
import { Journey } from "../types/journey";
import Link from "next/link";

export default function ParentJourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  // Create Journey State
  const [showCreateJourney, setShowCreateJourney] = useState(false);
  const [journeyForm, setJourneyForm] = useState({ child_id: "", start_location: "", end_location: "", duration_minutes: 30 });
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Journeys
      const resJourneys = await ParentJourneyAPI.getParentJourneys(page, statusFilter, search);
      setJourneys(resJourneys.data || []);
      setTotalPages(resJourneys.pagination?.last_page || 1);

      // Fetch Children for dropdown (only needs to be done once, but okay here)
      const resDashboard = await getParentDashboard();
      setChildren(resDashboard.children || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Role check: redirect non-parent users
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "parent") {
      if (user.role === "child") router.push("/child-dashboard");
      else if (user.role === "admin") router.push("/admin-dashboard");
      else router.push("/login");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500); // Debounce search
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this journey?")) return;
    try {
      await ParentJourneyAPI.deleteJourney(id);
      showMessage("success", "Journey deleted successfully");
      fetchData();
    } catch (err: any) {
      showMessage("error", "Failed to delete journey");
    }
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });
    try {
      await ParentJourneyAPI.createJourney({
        child_id: Number(journeyForm.child_id),
        start_location: journeyForm.start_location,
        end_location: journeyForm.end_location,
        duration_minutes: Number(journeyForm.duration_minutes)
      });
      setFormMessage({ type: "success", text: "Journey scheduled successfully!" });
      setJourneyForm({ child_id: "", start_location: "", end_location: "", duration_minutes: 30 });
      setTimeout(() => setShowCreateJourney(false), 1500);
      fetchData(); // Refresh list
    } catch (err: any) {
      setFormMessage({ type: "error", text: err.response?.data?.message || "Failed to schedule journey" });
    }
  };

  // Edit Journey State
  const [editJourney, setEditJourney] = useState<Journey | null>(null);
  const [editForm, setEditForm] = useState({ start_location: "", end_location: "", duration_minutes: 30 });
  const [editMessage, setEditMessage] = useState({ type: "", text: "" });

  const openEditModal = (j: Journey) => {
    setEditJourney(j);
    setEditForm({
      start_location: j.start_location,
      end_location: j.end_location,
      duration_minutes: j.duration_minutes || 30
    });
    setEditMessage({ type: "", text: "" });
  };

  const handleEditJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJourney) return;
    setEditMessage({ type: "", text: "" });
    try {
      await ParentJourneyAPI.updateJourney(editJourney.id, {
        start_location: editForm.start_location,
        end_location: editForm.end_location,
        duration_minutes: Number(editForm.duration_minutes)
      });
      setEditMessage({ type: "success", text: "Journey updated successfully!" });
      setTimeout(() => setEditJourney(null), 1500);
      fetchData();
    } catch (err: any) {
      setEditMessage({ type: "error", text: err.response?.data?.message || "Failed to update journey" });
    }
  };


  if (loading && page === 1 && !journeys.length) {
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
          <span className="navbar-brand mb-0 h1 fw-bold">👁️ Track Journeys</span>
          <div className="d-flex gap-2">
            <button onClick={() => setShowCreateJourney(true)} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">
              + Add Journey
            </button>
            <Link href="/parent-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">← Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="container pb-5">

        {/* Alerts */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} rounded-pill border-0 mb-4 text-center`}>
            {message.text}
          </div>
        )}

        {/* Filter & Search */}
        <div className="card card-dark rounded-4 p-4 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                placeholder="🔍 Search by Child Name..."
                className="form-control form-control-dark rounded-pill"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-3">
              <span className="text-secondary fw-bold small">FILTER:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="form-select form-control-dark rounded-pill border-0 w-auto text-white bg-secondary"
              >
                <option value="all">All Journeys</option>
                <option value="scheduled">Scheduled</option>
                <option value="started">Active</option>
                <option value="completed">Completed</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card card-dark rounded-4 p-4 mb-4">
          <h4 className="fw-bold mb-4">All Journeys</h4>
          {journeys.length === 0 ? (
            <div className="text-center py-5 text-secondary">No journeys found</div>
          ) : (
            <div className="row g-3">
              {journeys.map((j) => (
                <div key={j.id} className="col-md-6">
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-4 h-100 border border-secondary border-opacity-10 position-relative">

                    {/* Action Buttons */}
                    <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                      {j.status === 'scheduled' && (
                        <button
                          onClick={() => openEditModal(j)}
                          className="btn btn-sm btn-warning rounded-circle shadow-sm"
                          style={{ width: '32px', height: '32px', padding: 0, lineHeight: '30px' }}
                          title="Edit Journey"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="btn btn-sm btn-danger rounded-circle shadow-sm"
                        style={{ width: '32px', height: '32px', padding: 0, lineHeight: '30px' }}
                        title="Delete Journey"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <span>👧</span>
                      </div>
                      <div>
                        {/* Use child name if available, else ID */}
                        <div className="fw-bold small text-white">{j.child?.name ? j.child.name : `Child #${j.child_id}`}</div>
                        <span className={`badge rounded-pill ${j.status === "started" ? "bg-success" :
                          j.status === "completed" ? "bg-info" :
                            j.status === "scheduled" ? "bg-warning text-dark" : "bg-secondary"
                          }`}>
                          {j.status === "started" ? "🚶 Active" :
                            j.status === "completed" ? "✅ Done" :
                              j.status === "scheduled" ? "� Scheduled" : "�🛑 Stopped"}
                        </span>
                      </div>
                    </div>

                    <div className="ps-3 border-start border-2 border-primary border-opacity-50 ms-2">
                      <div className="mb-1 text-white small"><span className="text-success me-2">📍</span> {j.start_location}</div>
                      <div className="mb-1 text-white small"><span className="text-danger me-2">🏁</span> {j.end_location}</div>
                      {j.duration_minutes && j.status === 'scheduled' && (
                        <div className="mb-1 text-warning small"><span className="me-2">⏱️</span> {j.duration_minutes} mins</div>
                      )}
                    </div>

                    {/* Document Attachment Preview */}
                    {j.document_path && (
                      <div className="mt-3 p-2 bg-dark bg-opacity-50 rounded-3 border border-info border-opacity-25">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="text-info small">📎 Document Attached</span>
                          <a
                            href={`http://127.0.0.1:8000/storage/${j.document_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-info rounded-pill px-3"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between text-white opacity-50 small">
                      <span>Start: {j.started_at || 'Not started'}</span>
                      {j.ended_at && <span>End: {j.ended_at}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-dark rounded-pill px-4"
            >
              ← Prev
            </button>
            <span className="btn btn-light rounded-pill px-4 disabled text-dark fw-bold border-0">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-dark rounded-pill px-4"
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* Create Journey Modal */}
      {showCreateJourney && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-90" style={{ zIndex: 1050, backdropFilter: 'blur(5px)' }}>
          <div className="card card-dark p-4 rounded-4 shadow-lg w-100 border border-secondary border-opacity-25" style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0 text-white">Add Journey</h4>
              <button onClick={() => setShowCreateJourney(false)} className="btn btn-sm btn-dark rounded-circle border-0 text-secondary fs-5">✕</button>
            </div>

            {formMessage.text && (
              <div className={`alert ${formMessage.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 small rounded-3 text-center mb-4`}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateJourney}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">SELECT CHILD</label>
                <select
                  className="form-select form-control-dark rounded-3 py-2 px-3 focus-ring"
                  required
                  value={journeyForm.child_id}
                  onChange={e => setJourneyForm({ ...journeyForm, child_id: e.target.value })}
                >
                  <option value="">Choose...</option>
                  {children.map((child: any) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">START LOCATION</label>
                <input
                  type="text"
                  className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                  required
                  placeholder="e.g. School"
                  value={journeyForm.start_location}
                  onChange={e => setJourneyForm({ ...journeyForm, start_location: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">END LOCATION</label>
                <input
                  type="text"
                  className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                  required
                  placeholder="e.g. Home"
                  value={journeyForm.end_location}
                  onChange={e => setJourneyForm({ ...journeyForm, end_location: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">TIME LIMIT (MINUTES)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control form-control-dark rounded-3 py-2 px-3 focus-ring"
                  required
                  placeholder="e.g. 30"
                  value={journeyForm.duration_minutes}
                  onChange={e => setJourneyForm({ ...journeyForm, duration_minutes: Number(e.target.value) })}
                />
                <div className="form-text text-secondary small mt-1">If journey exceeds this time, SOS will be triggered.</div>
              </div>

              <button type="submit" className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                Create Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Journey Modal */}
      {editJourney && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setEditJourney(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white border-secondary rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">✏️ Edit Journey</h5>
                <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setEditJourney(null)}>✕</button>
              </div>

              {editMessage.text && (
                <div className={`alert ${editMessage.type === "success" ? "alert-success" : "alert-danger"} py-2 small`}>
                  {editMessage.text}
                </div>
              )}

              <form onSubmit={handleEditJourney}>
                <div className="mb-3">
                  <label className="form-label small text-light opacity-75">From Location</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary rounded-pill"
                    value={editForm.start_location}
                    onChange={e => setEditForm({ ...editForm, start_location: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-light opacity-75">To Location</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary rounded-pill"
                    value={editForm.end_location}
                    onChange={e => setEditForm({ ...editForm, end_location: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-light opacity-75">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary rounded-pill"
                    value={editForm.duration_minutes}
                    min="1"
                    onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })}
                  />
                </div>
                <button type="submit" className="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm">
                  Update Journey
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
