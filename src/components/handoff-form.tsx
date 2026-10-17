"use client";
import { Link } from "@/i18n/client";

import { UiText } from "@/i18n/client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { localePath } from "@/i18n/config";
const TOPICS = [
  "General",
  "Contribute/Join the network",
  "Commission a design",
  "Takedown",
  "Report a problem",
];
export function HandoffForm({ kind, email }: { kind: "contact" | "submit"; email: string }) {
  const router = useRouter();
  const { locale } = useI18n();
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
    const topic = String(data.get("topic") ?? "General");
    if (kind === "contact" && !TOPICS.includes(topic)) next.topic = "Choose a listed topic.";
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
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
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
        kind === "contact" ? `Topic: ${topic}` : "Artwork proposal",
        message,
        reply ? `Reply to: ${reply}` : "No reply address supplied.",
        kind === "submit"
          ? `Source: ${source}\nLicence and credit: ${String(data.get("license"))}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const url = `mailto:${email}?subject=${encodeURIComponent(`Red Lark Workshop ${kind === "submit" ? "artwork proposal" : "contact"}`)}&body=${encodeURIComponent(body)}`;
      const link = document.createElement("a");
      link.href = url;
      link.click();
      router.push(localePath(locale, `/thank-you/?for=${kind}`));
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
        <UiText id={"[ERROR]"} />
        <UiText id={errors[name]} />
      </p>
    ) : null;
  return (
    <form ref={form} className="handoff-form" onSubmit={onSubmit} noValidate>
      <p className="notice">
        <UiText
          id={
            "[EMAIL HANDOFF] This form prepares an email in your own mail app. It does not upload, store, or automatically send your message."
          }
        />{" "}
        {email
          ? "Review and send the email yourself."
          : "Delivery is unavailable until the project supplies a real inbox."}
      </p>
      <div className="honeypot" aria-hidden="true">
        <label>
          <UiText id={"Leave this empty"} />
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {kind === "contact" && (
        <label className="form-field" htmlFor="topic">
          <UiText id="Topic" />
          <select
            id="topic"
            name="topic"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? "topic-error" : undefined}
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                <UiText id={topic} />
              </option>
            ))}
          </select>
          {fieldError("topic")}
          <span>
            <UiText id="Contributors can include artists, writers, designers and legal volunteers. Commission enquiries are welcome from movements." />
          </span>
        </label>
      )}
      {kind === "submit" && (
        <>
          <label className="form-field" htmlFor="source">
            <UiText id={"ARTWORK / SOURCE LINK"} />
            <span>
              <UiText id={"(required)"} />
            </span>
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
            <UiText id={"LICENCE + ARTIST CREDIT"} />
            <span>
              <UiText id={"(required)"} />
            </span>
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
        <UiText id={kind === "submit" ? "TELL US ABOUT THE WORK" : "YOUR MESSAGE"} />{" "}
        <span>
          <UiText id={"(required, 10–3,000 characters)"} />
        </span>
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
          <UiText
            id={
              "Share only what is needed. Do not include private locations or identifying details."
            }
          />
        </span>
      </label>
      <label className="form-field" htmlFor="reply">
        <UiText id={"REPLY EMAIL"} />
        <span>
          <UiText id={"(optional)"} />
        </span>
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
            <UiText
              id={
                "I created this work or have explicit permission to share it. Publication requires review."
              }
            />
            {fieldError("permission")}
          </span>
        </label>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="notice">
          <UiText id={"[CHECK THE FORM]"} />
          {Object.keys(errors).length}
          <UiText id={"field"} />
          {Object.keys(errors).length === 1 ? "" : "s"}
          <UiText id={"need attention. Errors are written beside each field."} />
        </p>
      )}
      {failure && (
        <p role="alert" className="notice failure">
          <UiText id={failure} />
        </p>
      )}
      <button className="button accent" type="submit" disabled={sending}>
        <UiText id={sending ? "[OPENING EMAIL APP…]" : "[PREPARE EMAIL] ↗"} />
      </button>
      <p className="small">
        <UiText id={"No attachments are collected. Share an artwork link instead. Read"} />{" "}
        <Link href="/privacy/" className="underlined">
          <UiText id={"how we handle data"} />
        </Link>
        .
      </p>
    </form>
  );
}
