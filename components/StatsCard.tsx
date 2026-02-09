"use client";

interface StatsCardProps {
    icon: string;
    label: string;
    value: number | string;
    color?: "primary" | "success" | "warning" | "danger" | "info";
    highlight?: boolean;
}

export default function StatsCard({
    icon,
    label,
    value,
    color = "primary",
    highlight = false,
}: StatsCardProps) {
    const bgClass = `bg-${color} bg-opacity-10`;
    const textClass = color === "danger" && highlight ? "text-danger" : "text-white";
    const borderClass = highlight ? `border border-${color} border-opacity-25` : "";

    return (
        <div className={`${bgClass} p-4 rounded-4 text-center h-100 ${borderClass}`}>
            <div className="fs-1 mb-2">{icon}</div>
            <small className={highlight ? `text-${color} fw-bold` : "text-light opacity-75"}>
                {label}
            </small>
            <h2 className={`fw-bold mb-0 ${textClass}`}>{value}</h2>
        </div>
    );
}
