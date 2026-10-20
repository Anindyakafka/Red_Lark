"use client";
import { useI18n } from "@/i18n/client";
export function AdminRecords({ records, view }: { records: unknown; view: string }) {
  const { t } = useI18n();
  if (!records || typeof records !== "object") return null;
  const data = records as Record<string, unknown>;
  const key =
    view === "messages"
      ? "messages"
      : view === "takedowns"
        ? "takedowns"
        : view === "users"
          ? "profiles"
          : "audit";
  const rows = data[key];
  if (!Array.isArray(rows) || rows.length === 0)
    return <p role="status">{t("No records to display.")}</p>;
  const labels: Record<string, string> = {
    id: "Reference",
    message_id: "Message reference",
    body: "Message",
    email: "Email",
    status: "Status",
    created_at: "Created",
    artist_name: "Artist name",
    action: "Action",
    actor_id: "Actor",
    target_id: "Target",
    work_url: "Artwork URL",
    topic: "Topic",
    contact: "Contact",
    upi: "UPI ID",
    contact_public: "Contact consent",
    upi_public: "UPI consent",
    bio: "Bio",
  };
  return (
    <div className="admin-record-list">
      {rows.map((row: Record<string, unknown>, index: number) => (
        <article className="backend-panel" key={typeof row.id === "string" ? row.id : index}>
          <h2>{String(row.topic || row.artist_name || row.action || t("Record"))}</h2>
          <dl>
            {Object.entries(row)
              .filter(([, value]) => value !== null && value !== "")
              .map(([field, value]) => (
                <div key={field}>
                  <dt>{t(labels[field] || field.replaceAll("_", " "))}</dt>
                  <dd className="break-all">
                    {typeof value === "boolean"
                      ? t(value ? "Yes" : "No")
                      : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
