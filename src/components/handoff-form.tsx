"use client";
import { useRef, useState, type FormEvent } from "react";
import { Link, useI18n } from "@/i18n/client";
import { api, errorMessage } from "./account-client";
export function HandoffForm({
  kind = "contact",
}: {
  kind?: "contact" | "takedown";
  email?: string;
}) {
  const { t, locale } = useI18n(),
    form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [failure, setFailure] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false);
  const started = useRef(0),
    receipt = useRef("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      message = String(data.get("message") || "").trim(),
      reply = String(data.get("reply") || "").trim();
    const next: Record<string, string> = {};
    if (message.length < 10 || message.length > 3000)
      next.message = t("Use between 10 and 3,000 characters.");
    if (reply && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply))
      next.reply = t("Enter a valid reply address, or leave it blank.");
    if (kind === "takedown" && !/^https:\/\//.test(String(data.get("work_url") || "")))
      next.work_url = t("Provide an HTTPS link to the work.");
    setErrors(next);
    setFailure("");
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    if (data.get("website")) {
      setFailure(t("The spam check rejected this request. Leave the hidden field empty."));
      return;
    }
    if (!receipt.current) receipt.current = crypto.randomUUID();
    setBusy(true);
    try {
      await api(kind === "takedown" ? "takedown" : "contact", {
        ...Object.fromEntries(data),
        message,
        reply,
        locale,
        started: started.current,
        submission_key: receipt.current,
      });
      setSent(true);
    } catch (error) {
      setFailure(t(errorMessage(error instanceof Error ? error.message : "network_error")));
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <section className="notice" role="status">
        <h2>{t("Message received")}</h2>
        <p>
          {t(
            "Your message was saved and email was accepted by the provider. This does not guarantee inbox placement or a review decision.",
          )}
        </p>
        <Link className="button" href="/thank-you">
          {t("Continue")}
        </Link>
      </section>
    );
  function fieldError(name: string) {
    return errors[name] ? (
      <span id={`${name}-error`} className="field-error">
        ERROR {errors[name]}
      </span>
    ) : null;
  }
  return (
    <form
      method="post"
      ref={form}
      className="handoff-form"
      noValidate
      onSubmit={submit}
      onFocusCapture={() => {
        if (!started.current) started.current = Date.now();
      }}
    >
      <noscript>
        <p className="notice">
          {t(
            "Enable JavaScript to send this form, or use the displayed contact email. Form fields are never submitted in a URL.",
          )}
        </p>
      </noscript>
      <p className="notice">
        {t(
          "Messages are stored privately for the team. A reply address is optional; provide one if you want an acknowledgement. Do not include sensitive identifying details.",
        )}
      </p>
      <div className="honeypot" aria-hidden="true">
        <label>
          {t("Leave this empty")}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {kind === "contact" ? (
        <label className="form-field" htmlFor="topic">
          {t("Topic")}
          <select id="topic" name="topic">
            {[
              "General",
              "Contribute/Join the network",
              "Commission a design",
              "Takedown",
              "Report a problem",
            ].map((topic) => (
              <option key={topic} value={topic}>
                {t(topic)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="form-field" htmlFor="work_url">
          {t("Artwork URL")}
          <input
            id="work_url"
            name="work_url"
            type="url"
            aria-invalid={!!errors.work_url}
            aria-describedby={errors.work_url ? "work_url-error" : undefined}
          />
          {fieldError("work_url")}
        </label>
      )}
      <label className="form-field" htmlFor="message">
        {t("YOUR MESSAGE")} ({t("required, 10–3,000 characters")})
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={3000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : "message-help"}
        />
        {fieldError("message")}
        <span id="message-help">
          {t("Share only what is needed. Do not include private locations or identifying details.")}
        </span>
      </label>
      <label className="form-field" htmlFor="reply">
        {t("REPLY EMAIL")} ({t("optional")})
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
      {!!Object.keys(errors).length && (
        <p role="alert">
          {t("Check the highlighted fields. Errors are written beside each field.")}
        </p>
      )}
      {failure && (
        <p role="alert" className="notice failure">
          {failure}
        </p>
      )}
      <button type="submit" className="button accent" disabled={busy}>
        {t(busy ? "Sending…" : "Send message")}
      </button>
      <Link href="/privacy">{t("How we handle data")}</Link>
    </form>
  );
}
