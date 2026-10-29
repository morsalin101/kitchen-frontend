import { useState } from "react";

export type SellerApplicationDraft = {
  name: string;
  description: string;
};

type SellerApplicationModalProps = {
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (draft: SellerApplicationDraft) => Promise<void>;
};

export default function SellerApplicationModal({
  submitting,
  error,
  onClose,
  onSubmit,
}: SellerApplicationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    void onSubmit({ name: normalizedName, description: description.trim() });
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <section
        className="modal seller-application-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-application-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close kitchen registration">
          ×
        </button>
        <div className="seller-application-hero">
          <span className="seller-application-icon" aria-hidden="true">🍲</span>
          <span className="eyebrow">SELL ON KHABAR KOI</span>
          <h2 id="seller-application-title">Open your kitchen</h2>
          <p>
            Keep ordering as a Buyer while your kitchen application is reviewed.
            Once approved, you can manage your kitchen from the Seller workspace.
          </p>
        </div>

        <form className="seller-application-form" onSubmit={submit}>
          <label>
            Kitchen name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Nabila's Kitchen"
              maxLength={150}
              required
              disabled={submitting}
              autoFocus
            />
          </label>
          <label>
            About your kitchen <span className="optional-label">Optional</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What do you love cooking?"
              rows={3}
              disabled={submitting}
            />
          </label>

          <div className="seller-application-note">
            <strong>What happens next?</strong>
            <span>Your application starts as Pending Review. You can still use the Buyer experience.</span>
          </div>
          <p className="seller-application-dev-note">
            Development prototype: this submission currently uses test owner ID 1 until backend authentication is implemented.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="seller-application-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={submitting || !name.trim()}>
              {submitting ? "Submitting…" : "Submit kitchen"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
