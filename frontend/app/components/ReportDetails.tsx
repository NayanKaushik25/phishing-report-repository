import type { Report, Detail } from "../lib/types";

type ReportDetailsProps = {
  report: Report;
  details: Detail | null;
  onClose: () => void;
};

export default function ReportDetails({
  report,
  details,
  onClose,
}: ReportDetailsProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "28px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "22px", color: "#111827" }}>Report Details</h2>

        <button onClick={onClose}>Close</button>
      </div>

      <h3 style={{ marginTop: "24px", color: "#111827" }}>{report.title}</h3>

      <p style={{ margin: "12px 0", color: "#6b7280" }}>{report.description}</p>

      <p>
        <strong>Severity:</strong> {report.severity}
      </p>
      <p>
        <strong>Status:</strong> {report.status}
      </p>
      <p>
        <strong>Platform:</strong> {report.platformName}
      </p>
      <p>
        <strong>Account:</strong> {report.accountUsername}
      </p>
      <p>
        <strong>Category:</strong> {report.categoryName}
      </p>
      <p>
        <strong>Reported by:</strong> {report.reporterName}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h3>Investigation</h3>

      {details?.investigation ? (
        <>
          <p>{details.investigation.finding}</p>
          <p>
            <strong>Analyst:</strong> {details.investigation.analystName}
          </p>
        </>
      ) : (
        <p>No investigation recorded yet.</p>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3>Evidence</h3>

      {details?.evidence?.length ? (
        details.evidence.map((item) => (
          <div key={item.evidenceId} style={{ marginTop: "12px" }}>
            <p>
              <strong>{item.evidenceType}</strong>
            </p>
            <p>{item.description}</p>
            {item.filePathOrUrl && <p>{item.filePathOrUrl}</p>}
          </div>
        ))
      ) : (
        <p>No evidence submitted yet.</p>
      )}
    </div>
  );
}
