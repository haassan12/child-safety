"use client";

interface AlertBannerProps {
    type: "success" | "error" | "warning" | "info";
    message: string;
    onClose?: () => void;
}

export default function AlertBanner({ type, message, onClose }: AlertBannerProps) {
    if (!message) return null;

    const colorMap = {
        success: { bg: "bg-success", border: "border-success", icon: "✅" },
        error: { bg: "bg-danger", border: "border-danger", icon: "❌" },
        warning: { bg: "bg-warning", border: "border-warning", icon: "⚠️" },
        info: { bg: "bg-info", border: "border-info", icon: "ℹ️" },
    };

    const { bg, border, icon } = colorMap[type];

    return (
        <div
            className={`${bg} bg-opacity-10 ${border} border rounded-3 p-3 mb-3 d-flex align-items-center justify-content-between`}
        >
            <div className="d-flex align-items-center gap-2">
                <span>{icon}</span>
                <span className="text-white">{message}</span>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="btn btn-sm btn-link text-white text-decoration-none p-0"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
