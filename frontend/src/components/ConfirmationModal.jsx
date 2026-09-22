import React, { useEffect } from 'react';
import { AlertTriangleIcon, CloseIcon } from './Icons';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this operation?',
  details = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCancel}>
      <div 
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            {danger ? (
              <div className="modal-icon-danger">
                <AlertTriangleIcon size={20} color="#ef4444" />
              </div>
            ) : null}
            <h3 id="modal-title" className="modal-title">{title}</h3>
          </div>
          {!loading && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onCancel}
              aria-label="Close modal"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        <div className="modal-body">
          <p className="modal-desc">{description}</p>
          {details && (
            <div className="modal-details-box">
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
