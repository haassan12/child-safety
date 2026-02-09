"use client";

import { useEffect, useState } from "react";
import API from "../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileModal from "../components/ProfileModal";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_children: 0,
    active_journeys: 0,
    completed_journeys: 0,
    sos_alerts: 0,
  });
  const [recentJourneys, setRecentJourneys] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [allChildren, setAllChildren] = useState<any[]>([]);
  const [allParents, setAllParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sosPopup, setSosPopup] = useState<{ show: boolean; alert: any }>({ show: false, alert: null });
  const [lastAlertId, setLastAlertId] = useState<number | null>(null);

  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    // Role Check
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    if (user.role !== "admin") {
      if (user.role === 'parent') router.push('/parent-dashboard');
      else if (user.role === 'child') router.push('/child-dashboard');
      else router.push('/login');
      return;
    }

    // Initial data fetch (runs once)
    async function fetchInitialData() {
      try {
        // Fetch stats first to show page quickly
        const resStats = await API.get<{ success: boolean; data: any }>("/admin/dashboard");
        if (resStats.data.data) {
          setStats(resStats.data.data);
          const latest = resStats.data.data.latest_alert;
          if (latest) setLastAlertId(latest.id);
        }
        setLoading(false); // Show page immediately after stats load

        // Fetch remaining data in parallel (background)
        const [resJourneys, resAlerts, resChildren, resParents] = await Promise.all([
          API.get<{ success: boolean; data: any }>("/admin/journeys/recent").catch(() => ({ data: { data: [] } })),
          API.get<{ success: boolean; data: any }>("/admin/alerts/recent").catch(() => ({ data: { data: [] } })),
          API.get<{ success: boolean; data: any }>("/admin/children").catch(() => ({ data: { data: [] } })),
          API.get<{ success: boolean; data: any }>("/admin/parents").catch(() => ({ data: { data: [] } })),
        ]);

        setRecentJourneys(resJourneys.data.data || []);
        setRecentAlerts(resAlerts.data.data || []);
        setAllChildren(resChildren.data.data || []);
        setAllParents(resParents.data.data || []);
      } catch (err: any) {
        console.log("API Error:", err);
        setLoading(false); // Always stop loading even on error
        if (err.response && err.response.status === 401) {
          sessionStorage.clear();
          router.push('/login');
        }
      }
    }

    // Lightweight refresh for SOS alerts only (runs every 10 seconds)
    async function refreshAlerts() {
      try {
        const [resStats, resAlerts] = await Promise.all([
          API.get<{ success: boolean; data: any }>("/admin/dashboard"),
          API.get<{ success: boolean; data: any }>("/admin/alerts/recent"),
        ]);

        if (resStats.data.data) {
          setStats(resStats.data.data);
          const latest = resStats.data.data.latest_alert;
          if (latest && latest.id !== lastAlertId) {
            if (lastAlertId !== null) {
              setSosPopup({ show: true, alert: latest });
              new Audio('/sos_sound.mp3').play().catch(() => { });
            }
            setLastAlertId(latest.id);
          }
        }
        setRecentAlerts(resAlerts.data.data || []);
      } catch (err: any) {
        console.log("Refresh Error:", err);
      }
    }

    fetchInitialData();

    // Auto-refresh only alerts every 10 seconds (lighter load)
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, [lastAlertId, router]);

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
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark py-3 px-4 mb-4 shadow-sm">
        <div className="container">
          <span className="navbar-brand mb-0 h1 fw-bold">🛡️ Admin Dashboard</span>
          <div className="d-flex gap-2">
            <button onClick={() => setShowProfile(true)} className="btn btn-outline-light btn-sm rounded-pill px-3">
              👤 Profile
            </button>
            <Link href="/" className="btn btn-outline-light btn-sm rounded-pill px-3">← Home</Link>
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

        {/* SOS POPUP */}
        {sosPopup.show && sosPopup.alert && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-90" style={{ zIndex: 2000 }}>
            <div className="card border-danger border-3 shadow-lg p-4 rounded-4 text-center bg-dark text-white animate-pulse" style={{ maxWidth: '450px' }}>
              <div className="mb-3 text-danger display-1">🚨</div>
              <h2 className="text-danger fw-bold mb-2">SOS ALERT!</h2>
              <h4 className="fw-bold mb-3">{sosPopup.alert.child_name || "Unknown Child"}</h4>
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
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="card card-dark rounded-4 p-4 mb-4">
          <h4 className="fw-bold mb-4">System Overview</h4>
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="bg-primary bg-opacity-10 p-4 rounded-4 text-center h-100">
                <div className="fs-1 mb-2">👧</div>
                <small className="text-light opacity-75">Children</small>
                <h3 className="fw-bold mb-0 text-white">{stats.total_children}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-success bg-opacity-10 p-4 rounded-4 text-center h-100">
                <div className="fs-1 mb-2">🚶</div>
                <small className="text-light opacity-75">Active</small>
                <h3 className="fw-bold mb-0 text-white">{stats.active_journeys}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-warning bg-opacity-10 p-4 rounded-4 text-center h-100">
                <div className="fs-1 mb-2">✅</div>
                <small className="text-light opacity-75">Completed</small>
                <h3 className="fw-bold mb-0 text-white">{stats.completed_journeys}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-danger bg-opacity-10 p-4 rounded-4 text-center h-100 border border-danger border-opacity-25">
                <div className="fs-1 mb-2">🚨</div>
                <small className="text-danger fw-bold">SOS ALERTS</small>
                <h3 className="fw-bold mb-0 text-danger">{stats.sos_alerts}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          {/* Recent Journeys */}
          <div className="col-md-6">
            <div className="card card-dark rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3 text-white">🗺️ Recent Journeys</h5>
              {recentJourneys.length === 0 ? (
                <div className="text-center py-4 text-secondary">No journeys yet</div>
              ) : (
                <div className="list-group list-group-flush rounded-3 overflow-hidden">
                  {recentJourneys.slice(0, 5).map((j, i) => (
                    <Link key={j.id || i} href={`/admin/journey/${j.id}`} className="text-decoration-none">
                      <div className="list-group-item bg-secondary bg-opacity-10 text-white border-dark d-flex justify-content-between align-items-center px-3 py-2 list-group-item-action">
                        <div>
                          <div className="fw-bold small">{j.child_name || "Child"}</div>
                          <small className="text-light opacity-50">{j.start_location} → {j.end_location}</small>
                        </div>
                        <span className={`badge rounded-pill ${j.status === "started" ? "bg-success" : "bg-secondary"}`}>
                          {j.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SOS Alerts */}
          <div className="col-md-6">
            <div className="card card-dark rounded-4 p-4 h-100 border border-danger border-opacity-25">
              <h5 className="fw-bold mb-3 text-danger">🚨 Recent SOS Alerts</h5>
              {recentAlerts.length === 0 ? (
                <div className="text-center py-4 text-success fw-bold">✅ All children are safe!</div>
              ) : (
                <div className="list-group list-group-flush rounded-3 overflow-hidden">
                  {recentAlerts.slice(0, 5).map((a, i) => (
                    <div key={a.id || i} className="list-group-item bg-danger bg-opacity-10 text-white border-danger border-opacity-10 px-3 py-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <div className="fw-bold small text-danger">{a.child_name || "Child"}</div>
                          <small className="text-light opacity-75">{a.message}</small>
                        </div>
                        <span className="fs-4">⚠️</span>
                      </div>
                      {/* Location with Map Link */}
                      {a.latitude && a.longitude && (
                        <div className="d-flex align-items-center justify-content-between bg-primary bg-opacity-10 p-2 rounded-3 border border-primary border-opacity-25">
                          <div className="d-flex align-items-center gap-2">
                            <span>📍</span>
                            <span className="small text-light">{a.location_address || 'Location captured'}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm rounded-pill px-2 py-0 fw-bold"
                            style={{ fontSize: '0.7rem' }}
                          >
                            Map
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Children Section */}
        <div className="card card-dark rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3 text-white">👧 All Children ({allChildren.length})</h5>
          {allChildren.length === 0 ? (
            <div className="text-center py-4 text-secondary">No children registered yet</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 bg-transparent">
                <thead>
                  <tr>
                    <th className="bg-transparent text-secondary small py-3">NAME</th>
                    <th className="bg-transparent text-secondary small py-3">EMAIL</th>
                    <th className="bg-transparent text-secondary small py-3">PARENT</th>
                    <th className="bg-transparent text-secondary small py-3 text-center">JOURNEYS</th>
                    <th className="bg-transparent text-secondary small py-3 text-center">SOS</th>
                    <th className="bg-transparent text-secondary small py-3 text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {allChildren.map((child: any) => (
                    <tr key={child.id}>
                      <td className="bg-transparent align-middle py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold" style={{ width: '36px', height: '36px' }}>
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-bold text-white">{child.name}</span>
                        </div>
                      </td>
                      <td className="bg-transparent align-middle text-light opacity-75 small">{child.email}</td>
                      <td className="bg-transparent align-middle">
                        <span className="badge bg-success bg-opacity-25 text-success rounded-pill">{child.parent_name}</span>
                      </td>
                      <td className="bg-transparent align-middle text-center">
                        <span className="badge bg-primary rounded-pill">{child.total_journeys}</span>
                      </td>
                      <td className="bg-transparent align-middle text-center">
                        <span className={`badge rounded-pill ${child.sos_alerts > 0 ? 'bg-danger' : 'bg-secondary'}`}>{child.sos_alerts}</span>
                      </td>
                      <td className="bg-transparent align-middle text-end">
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete ${child.name}?`)) {
                              try {
                                await API.delete(`/admin/user/${child.id}`);
                                setAllChildren(allChildren.filter(c => c.id !== child.id));
                              } catch (e) {
                                alert('Failed to delete');
                              }
                            }
                          }}
                          className="btn btn-sm btn-danger rounded-pill px-3"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Parents Section */}
        <div className="card card-dark rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3 text-white">👨‍👩‍👧 All Parents ({allParents.length})</h5>
          {allParents.length === 0 ? (
            <div className="text-center py-4 text-secondary">No parents registered yet</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 bg-transparent">
                <thead>
                  <tr>
                    <th className="bg-transparent text-secondary small py-3">NAME</th>
                    <th className="bg-transparent text-secondary small py-3">EMAIL</th>
                    <th className="bg-transparent text-secondary small py-3 text-center">CHILDREN</th>
                    <th className="bg-transparent text-secondary small py-3">JOINED</th>
                    <th className="bg-transparent text-secondary small py-3 text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {allParents.map((parent: any) => (
                    <tr key={parent.id}>
                      <td className="bg-transparent align-middle py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-success bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center text-success fw-bold" style={{ width: '36px', height: '36px' }}>
                            {parent.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-bold text-white">{parent.name}</span>
                        </div>
                      </td>
                      <td className="bg-transparent align-middle text-light opacity-75 small">{parent.email}</td>
                      <td className="bg-transparent align-middle text-center">
                        <span className="badge bg-primary rounded-pill">{parent.total_children}</span>
                      </td>
                      <td className="bg-transparent align-middle text-secondary small">
                        {new Date(parent.created_at).toLocaleDateString()}
                      </td>
                      <td className="bg-transparent align-middle text-end">
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete ${parent.name}? Their children will be unlinked.`)) {
                              try {
                                await API.delete(`/admin/user/${parent.id}`);
                                setAllParents(allParents.filter(p => p.id !== parent.id));
                              } catch (e) {
                                alert('Failed to delete');
                              }
                            }
                          }}
                          className="btn btn-sm btn-danger rounded-pill px-3"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="card bg-white border-0 shadow-sm rounded-4 p-4">
          <h5 className="text-dark fw-bold mb-3">Navigation</h5>
          <div className="d-flex gap-2">
            <Link href="/" className="btn btn-light rounded-pill px-4">Home →</Link>
          </div>
        </div>

      </div>
    </div >
  );
}