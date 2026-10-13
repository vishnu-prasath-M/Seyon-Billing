"use client";
import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type });
  }

  function hideToast() {
    setToast(null);
  }

  return { toast, showToast, hideToast };
}

interface ConfirmDialogProps {
  isOpen?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen = true,
  title,
  message,
  confirmLabel = "Confirm",
  confirmText,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (isOpen === false) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {confirmText || confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13 }}>{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  description,
  action,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const desc = description || message;
  return (
    <div className="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="32" height="32" rx="4"/>
        <path d="M16 24h16M16 30h10"/>
      </svg>
      <h3 style={{ marginTop: 8 }}>{title}</h3>
      {desc && <p>{desc}</p>}
      {(action || (actionLabel && onAction)) && (
        <div style={{ marginTop: 16 }}>
          {action || (
            <button className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
