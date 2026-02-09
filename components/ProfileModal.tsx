"use client";

import { useState } from "react";
import API from "../services/api";

interface ProfileModalProps {
    user: any;
    onClose: () => void;
    onUpdate: (updatedUser: any) => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        if (password && password !== passwordConfirmation) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setLoading(false);
            return;
        }

        try {
            const payload: any = { name };
            if (password) {
                payload.password = password;
                payload.password_confirmation = passwordConfirmation;
            }

            const res = await API.post("/profile/update", payload);

            // Update session storage
            const updatedUser = res.data.user;
            sessionStorage.setItem("user", JSON.stringify(updatedUser));

            setMessage({ type: "success", text: "Profile updated successfully!" });
            onUpdate(updatedUser);

            // Clear password fields
            setPassword("");
            setPasswordConfirmation("");

            // Close modal after delay
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error(err);
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content card-dark text-white rounded-4 shadow-lg border-0">
                    <div className="modal-header border-bottom border-secondary">
                        <h5 className="modal-title fw-bold">👤 Update Profile</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">

                        {message.text && (
                            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 small rounded-pill text-center mb-3`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small text-secondary fw-bold">Name</label>
                                <input
                                    type="text"
                                    className="form-control form-control-dark rounded-pill"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small text-secondary fw-bold">Email (Read-only)</label>
                                <input
                                    type="email"
                                    className="form-control form-control-dark rounded-pill"
                                    style={{ backgroundColor: '#343a40', color: '#e9ecef', cursor: 'not-allowed' }}
                                    value={user.email}
                                    readOnly
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small text-secondary fw-bold">New Password (Optional)</label>
                                <input
                                    type="password"
                                    className="form-control form-control-dark rounded-pill"
                                    placeholder="Leave blank to keep current"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>

                            {password && (
                                <div className="mb-4">
                                    <label className="form-label small text-secondary fw-bold">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="form-control form-control-dark rounded-pill"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-outline-light rounded-pill px-4" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
