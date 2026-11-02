type StatCardProps = {
  title: string;
  value: number;
  description?: string;
};

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "24px",
        minWidth: "180px",
        flex: 1,
      }}
    >
      <p style={{ color: "#6b7280", fontSize: "14px" }}>{title}</p>

      <h2
        style={{
          fontSize: "30px",
          fontWeight: 700,
          color: "#111827",
          margin: "12px 0",
        }}
      >
        {value}
      </h2>

      {description && (
        <p style={{ color: "#9ca3af", fontSize: "12px" }}>{description}</p>
      )}
    </div>
  );
}
