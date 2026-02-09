"use client";

interface DocumentPreviewProps {
    documentPath?: string | null;
    onUpload?: (file: File) => void;
    uploading?: boolean;
}

export default function DocumentPreview({
    documentPath,
    onUpload,
    uploading = false,
}: DocumentPreviewProps) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
    };

    const isImage = documentPath?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = documentPath?.match(/\.pdf$/i);

    return (
        <div className="document-preview">
            {documentPath ? (
                <div className="bg-dark bg-opacity-50 rounded-3 p-3 border border-secondary">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-light fw-bold">📎 Attached Document</span>
                        <a
                            href={`${baseUrl}/storage/${documentPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary rounded-pill"
                        >
                            View / Download
                        </a>
                    </div>
                    {isImage && (
                        <img
                            src={`${baseUrl}/storage/${documentPath}`}
                            alt="Document Preview"
                            className="img-fluid rounded-3 mt-2"
                            style={{ maxHeight: "200px", objectFit: "contain" }}
                        />
                    )}
                    {isPdf && (
                        <div className="text-center py-4 bg-secondary bg-opacity-25 rounded-3 mt-2">
                            <div className="display-4">📄</div>
                            <p className="text-light mb-0 small">PDF Document</p>
                        </div>
                    )}
                    {!isImage && !isPdf && (
                        <div className="text-center py-4 bg-secondary bg-opacity-25 rounded-3 mt-2">
                            <div className="display-4">📁</div>
                            <p className="text-light mb-0 small">File Attached</p>
                        </div>
                    )}
                </div>
            ) : onUpload ? (
                <div className="bg-dark bg-opacity-25 rounded-3 p-4 border border-dashed border-secondary text-center">
                    <div className="display-4 mb-2 opacity-50">📤</div>
                    <p className="text-light opacity-75 mb-3">No document attached</p>
                    <label className="btn btn-sm btn-outline-primary rounded-pill">
                        {uploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Uploading...
                            </>
                        ) : (
                            <>Upload Document</>
                        )}
                        <input
                            type="file"
                            className="d-none"
                            onChange={handleFileChange}
                            disabled={uploading}
                            accept="image/*,.pdf,.doc,.docx"
                        />
                    </label>
                </div>
            ) : (
                <div className="text-secondary text-center py-3">
                    <small>No document attached</small>
                </div>
            )}
        </div>
    );
}
