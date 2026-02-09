"use client";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    message?: string;
    fullPage?: boolean;
}

export default function LoadingSpinner({
    size = "md",
    message = "Loading...",
    fullPage = false,
}: LoadingSpinnerProps) {
    const sizeMap = {
        sm: { spinner: "spinner-border-sm", text: "small" },
        md: { spinner: "", text: "" },
        lg: { spinner: "spinner-border-lg", text: "fs-5" },
    };

    const { spinner, text } = sizeMap[size];

    const content = (
        <div className="text-center py-4">
            <div className={`spinner-border text-primary ${spinner}`} role="status">
                <span className="visually-hidden">{message}</span>
            </div>
            {message && <p className={`text-light mt-3 ${text}`}>{message}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
                {content}
            </div>
        );
    }

    return content;
}
