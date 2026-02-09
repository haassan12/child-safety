"use client";

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    footer?: React.ReactNode;
}

export default function Modal({
    show,
    onClose,
    title,
    children,
    size = "md",
    footer,
}: ModalProps) {
    if (!show) return null;

    const sizeClass = {
        sm: "modal-sm",
        md: "",
        lg: "modal-lg",
        xl: "modal-xl",
    }[size];

    return (
        <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={onClose}
        >
            <div
                className={`modal-dialog modal-dialog-centered ${sizeClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content bg-dark text-white border-secondary rounded-4">
                    <div className="modal-header border-secondary">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">{children}</div>
                    {footer && (
                        <div className="modal-footer border-secondary">{footer}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
