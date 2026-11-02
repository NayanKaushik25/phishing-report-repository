import type { Report } from "../lib/types";

type ReportCardProps = {
  report: Report;
  onClick: (report: Report) => void;
};

export default function ReportCard({ report, onClick }: ReportCardProps) {
  return (
    <div
      onClick={() => onClick(report)}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "20px",
        cursor: "pointer",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <h3 style={{ color: "#111827", fontSize: "16px" }}>{report.title}</h3>

        <span
          style={{
            color: "#92400e",
            background: "#fef3c7",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            height: "fit-content",
          }}
        >
          {report.severity}
        </span>
      </div>

      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          margin: "12px 0",
        }}
      >
        {report.description}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#9ca3af",
          fontSize: "12px",
        }}
      >
        <span>{report.platformName}</span>
        <span>{report.status}</span>
      </div>
    </div>
  );
}
