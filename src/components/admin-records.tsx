"use client";
import { useState, useRef } from "react";
import { useI18n } from "@/i18n/client";
export type AuditFilters = { start: string; end: string; action: string; offset: number };
export function AdminRecords({
  records,
  view,
  onFilter,
}: {
  records: unknown;
  view: string;
  onFilter?: (filters: AuditFilters) => Promise<void>;
}) {
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
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
  const rows = Array.isArray(data[key]) ? (data[key] as Record<string, unknown>[]) : [];
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
  function details(row: Record<string, unknown>) {
    return (
      <details>
        <summary>
          {t("Show details")} — {String(row.id ?? "")}
        </summary>
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
      </details>
    );
  }
  async function filter(offset = 0) {
    if (!onFilter || !form.current) return;
    const values = new FormData(form.current),
      start = String(values.get("start") || ""),
      end = String(values.get("end") || "");
    if (start && end && start > end) {
      setError(t("Choose an end time after the start time."));
      form.current.querySelector<HTMLInputElement>('[name="end"]')?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onFilter({
        start: start ? `${start}:00Z` : "",
        end: end ? `${end}:59.999Z` : "",
        action: String(values.get("action") || "").trim(),
        offset,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="admin-record-list"
      aria-label={t(view === "audit" ? "Audit log" : "Records")}
    >
      {view === "audit" && (
        <>
          <form
            ref={form}
            className="audit-filters"
            onSubmit={(event) => {
              event.preventDefault();
              void filter();
            }}
          >
            <label className="form-field">
              {t("From (UTC)")}
              <input type="datetime-local" name="start" />
            </label>
            <label className="form-field">
              {t("Until (UTC)")}
              <input
                type="datetime-local"
                name="end"
                aria-invalid={!!error}
                aria-describedby={error ? "audit-filter-error" : undefined}
              />
            </label>
            <label className="form-field">
              {t("Action (exact match)")}
              <input
                name="action"
                maxLength={100}
                placeholder="works:UPDATE"
                list="audit-actions"
              />
              <datalist id="audit-actions">
                {Array.from(
                  new Set([
                    "works:UPDATE",
                    "works:INSERT",
                    "review_metadata",
                    "staff_invited",
                    "admin_granted",
                    "review_queue",
                    "audit_read",
                    ...rows.map((row) => String(row.action || "")),
                  ]),
                ).map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </label>
            <button className="button" disabled={busy}>
              {t("Apply filters")}
            </button>
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={() => {
                form.current?.reset();
                void filter();
              }}
            >
              {t("Clear filters")}
            </button>
            {error && (
              <p id="audit-filter-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <p role="status">
            {rows.length} {t("records shown")} / {Number(data.total ?? rows.length)} {t("total")}.{" "}
            {t("Times are shown in UTC. Details are collapsed by default.")}
          </p>
        </>
      )}
      {!rows.length ? (
        <p role="status">{t("No records to display.")}</p>
      ) : view === "audit" ? (
        <div
          className="audit-table-scroll"
          role="region"
          aria-label={t("Audit log table")}
          tabIndex={0}
        >
          <table className="audit-table">
            <caption>{t("Audit log")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("Time (UTC)")}</th>
                <th scope="col">{t("Action")}</th>
                <th scope="col">{t("Details")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  <td>
                    <time dateTime={String(row.created_at)}>
                      {String(row.created_at)
                        .replace("T", " ")
                        .replace(/\.\d+Z$/, "Z")}
                    </time>
                  </td>
                  <td>{String(row.action || "")}</td>
                  <td>{details(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        rows.map((row, index) => (
          <article className="backend-panel" key={String(row.id ?? index)}>
            <h2>{String(row.topic || row.artist_name || row.action || t("Record"))}</h2>
            {details(row)}
          </article>
        ))
      )}
      {view === "audit" && (
        <div className="button-row">
          <button
            className="button"
            disabled={busy || Number(data.offset || 0) === 0}
            onClick={() => void filter(Math.max(0, Number(data.offset || 0) - 50))}
          >
            {t("Previous page")}
          </button>
          <button
            className="button"
            disabled={
              busy || Number(data.offset || 0) + rows.length >= Number(data.total ?? rows.length)
            }
            onClick={() => void filter(Number(data.offset || 0) + 50)}
          >
            {t("Next page")}
          </button>
        </div>
      )}
    </section>
  );
}
