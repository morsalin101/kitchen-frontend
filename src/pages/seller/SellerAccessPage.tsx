import type { SellerApplicationRecord } from "../../types/roles";

type SellerAccessPageProps = {
  application: SellerApplicationRecord;
  onBackToBuyer: () => void;
  onCreateAnother: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  refreshError: string | null;
};

export default function SellerAccessPage({
  application,
  onBackToBuyer,
  onCreateAnother,
  onRefresh,
  refreshing,
  refreshError,
}: SellerAccessPageProps) {
  const isRejected = application.status === "REJECTED";
  return (
    <main className="seller-access-page">
      <div className="seller-access-wrap">
        <button className="seller-back-link" onClick={onBackToBuyer}>← Back to Buyer</button>
        <section className={`seller-access-card ${isRejected ? "is-rejected" : ""}`}>
          <div className="seller-access-symbol" aria-hidden="true">{isRejected ? "↻" : "✓"}</div>
          <span className="eyebrow">SELLER WORKSPACE</span>
          <h1>{isRejected ? "Let's get your kitchen ready" : "Your kitchen is under review"}</h1>
          <p className="seller-access-lead">
            {isRejected
              ? "This kitchen application was rejected. Review the information and submit a new application when you're ready."
              : "Your application has reached Khabar Koi. While the admin team reviews it, you can keep browsing and ordering food as a Buyer."}
          </p>

          <div className="seller-application-summary">
            <div>
              <span>Kitchen</span>
              <strong>{application.kitchenName}</strong>
            </div>
            <div>
              <span>Application ID</span>
              <strong>#{application.kitchenId}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{new Date(application.submittedAt).toLocaleDateString()}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className={`application-status-text status-${application.status.toLowerCase()}`}>
                {application.status.replace(/_/g, " ")}
              </strong>
            </div>
          </div>

          <div className="seller-access-next-steps">
            <strong>{isRejected ? "Next step" : "What happens next?"}</strong>
            <p>
              {isRejected
                ? "You can submit a new kitchen application. Your current application remains in your history."
                : "When the backend records this kitchen as ACTIVE, the Seller Dashboard will become available here. Until then, the Buyer portal remains available."}
            </p>
          </div>

          {refreshError && <p className="form-error" role="alert">{refreshError}</p>}
          <div className="seller-access-actions">
            <button className="button button-primary" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh application status"}
            </button>
            {isRejected && <button className="button button-secondary" onClick={onCreateAnother}>Submit another kitchen</button>}
            <button className="button button-secondary" onClick={onBackToBuyer}>Continue as Buyer</button>
          </div>
          <p className="demo-note">
            Prototype note: authentication and application ownership still use local demo state plus test owner ID 1. Backend authorization will be added before production.
          </p>
        </section>
      </div>
    </main>
  );
}
