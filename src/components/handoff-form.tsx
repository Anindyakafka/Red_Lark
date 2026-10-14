"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
export function HandoffForm({ kind, email }: { kind: "contact" | "submit"; email: string }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [sending, setSending] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure("");
    const data = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    const message = String(data.get("message") ?? "").trim();
    const reply = String(data.get("reply") ?? "").trim();
    const source = String(data.get("source") ?? "").trim();
    if (String(data.get("website") ?? "")) {
      setFailure(
        "[NOT SENT] The spam check rejected this request. Please leave the hidden field empty.",
      );
      return;
    }
    if (message.length < 10 || message.length > 3000)
      next.message = "Use between 10 and 3,000 characters.";
    if (reply && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply))
      next.reply = "Enter a valid reply address, or leave it blank.";
    if (kind === "submit") {
      if (!/^https:\/\//.test(source))
        next.source = "Provide an HTTPS link to your artwork or source.";
      if (!String(data.get("license") ?? "").trim())
        next.license = "State the explicit licence and artist credit.";
      if (!data.get("permission"))
        next.permission = "Confirm you have permission to share this work.";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(),
      );
      return;
    }
    if (!email) {
      setFailure(
        "[NOT SENT] No contact inbox is configured. This site cannot deliver your message yet. Nothing was uploaded or stored.",
      );
      return;
    }
    setSending(true);
    try {
      const body = [
        message,
        reply ? `Reply to: ${reply}` : "No reply address supplied.",
        kind === "submit"
          ? `Source: ${source}\nLicence and credit: ${String(data.get("license"))}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const url = `mailto:${email}?subject=${encodeURIComponent(`Mirafra ${kind === "submit" ? "artwork proposal" : "contact"}`)}&body=${encodeURIComponent(body)}`;
      const link = document.createElement("a");
      link.href = url;
      link.click();
      router.push(`/thank-you/?for=${kind}`);
    } catch {
      setFailure(
        "[NOT SENT] Your browser could not open an email app. Use the displayed contact address in your own mail app. Your message was not saved.",
      );
      setSending(false);
    }
  }
  const fieldError = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="field-error">
        [ERROR] {errors[name]}
      </p>
    ) : null;
  return (
    <form ref={form} className="handoff-form" onSubmit={onSubmit} noValidate>
      <p className="notice">
        [EMAIL HANDOFF] This form prepares an email in your own mail app. It does not upload, store,
        or automatically send your message.{" "}
        {email
          ? "Review and send the email yourself."
          : "Delivery is unavailable until the project supplies a real inbox."}
      </p>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {kind === "submit" && (
        <>
          <label className="form-field" htmlFor="source">
            ARTWORK / SOURCE LINK <span>(required)</span>
            <input
              id="source"
              name="source"
              type="url"
              aria-invalid={!!errors.source}
              aria-describedby={errors.source ? "source-error" : undefined}
            />
            {fieldError("source")}
          </label>
          <label className="form-field" htmlFor="license">
            LICENCE + ARTIST CREDIT <span>(required)</span>
            <input
              id="license"
              name="license"
              aria-invalid={!!errors.license}
              aria-describedby={errors.license ? "license-error" : undefined}
            />
            {fieldError("license")}
          </label>
        </>
      )}
      <label className="form-field" htmlFor="message">
        {kind === "submit" ? "TELL US ABOUT THE WORK" : "YOUR MESSAGE"}{" "}
        <span>(required, 10–3,000 characters)</span>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={3000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : "message-help"}
        />
        {fieldError("message")}
        <span id="message-help" className="small">
          Share only what is needed. Do not include private locations or identifying details.
        </span>
      </label>
      <label className="form-field" htmlFor="reply">
        REPLY EMAIL <span>(optional)</span>
        <input
          id="reply"
          name="reply"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.reply}
          aria-describedby={errors.reply ? "reply-error" : undefined}
        />
        {fieldError("reply")}
      </label>
      {kind === "submit" && (
        <label className="checkbox-field">
          <input
            type="checkbox"
            name="permission"
            aria-invalid={!!errors.permission}
            aria-describedby={errors.permission ? "permission-error" : undefined}
          />
          <span>
            I created this work or have explicit permission to share it. Publication requires
            review.{fieldError("permission")}
          </span>
        </label>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="notice">
          [CHECK THE FORM] {Object.keys(errors).length} field
          {Object.keys(errors).length === 1 ? "" : "s"} need attention. Errors are written beside
          each field.
        </p>
      )}
      {failure && (
        <p role="alert" className="notice failure">
          {failure}
        </p>
      )}
      <button className="button accent" type="submit" disabled={sending}>
        {sending ? "[OPENING EMAIL APP…]" : "[PREPARE EMAIL] ↗"}
      </button>
      <p className="small">
        No attachments are collected. Share an artwork link instead. Read{" "}
        <a href="/privacy/" className="underlined">
          how we handle data
        </a>
        .
      </p>
    </form>
  );
}
