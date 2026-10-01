"use client";

import { useId, useRef, useState, type FormEvent } from "react";

type FormStatus = {
  state: "idle" | "pending" | "success" | "error";
  message: string;
};

export function ContactForm() {
  const id = useId();
  const submitting = useRef(false);
  const [status, setStatus] = useState<FormStatus>({
    state: "idle",
    message: "",
  });
  const pending = status.state === "pending";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const submission = {
      name: String(fields.get("name") ?? "").trim(),
      email: String(fields.get("email") ?? "").trim(),
      phone: String(fields.get("phone") ?? "").trim(),
      message: String(fields.get("message") ?? "").trim(),
      website: String(fields.get("website") ?? ""),
    };

    if (submission.name.length < 2 || submission.message.length < 10) {
      setStatus({
        state: "error",
        message:
          "Please enter your name and a message of at least 10 characters.",
      });
      return;
    }

    submitting.current = true;
    setStatus({ state: "pending", message: "Sending your message…" });

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: AbortSignal.timeout(35_000),
      });
      const result: unknown = await response.json();
      const payload = result && typeof result === "object" ? result : null;
      const message =
        payload && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Your message could not be sent. Please try again or contact the office by phone.";

      if (
        response.ok &&
        payload &&
        "success" in payload &&
        payload.success === true
      ) {
        setStatus({ state: "success", message });
        form.reset();
      } else {
        setStatus({ state: "error", message });
      }
    } catch {
      setStatus({
        state: "error",
        message:
          "We could not confirm delivery of your message. Please try again or call the office.",
      });
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form
      className="contact-form"
      action="/api/contact/"
      method="post"
      onSubmit={handleSubmit}
      aria-busy={pending}
    >
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`${id}-name`}>Name</label>
          <input
            className="form-input"
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
            disabled={pending}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${id}-email`}>Email Address</label>
          <input
            className="form-input"
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={pending}
          />
        </div>
        <div className="form-field full-width">
          <label htmlFor={`${id}-phone`}>Phone Number</label>
          <input
            className="form-input"
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={50}
            disabled={pending}
          />
        </div>
        <div className="form-field full-width">
          <label htmlFor={`${id}-message`}>Message</label>
          <textarea
            className="form-textarea"
            id={`${id}-message`}
            name="message"
            minLength={10}
            maxLength={5_000}
            rows={5}
            required
            disabled={pending}
          />
        </div>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          autoComplete="off"
          tabIndex={-1}
          maxLength={200}
          disabled={pending}
        />
      </div>
      <button className="button button-gold" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
      <div
        className="form-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-state={status.state}
      >
        {status.message && <p>{status.message}</p>}
        {status.state === "error" && (
          <p>
            <a href="tel:+16617460235">Call (661) 746-0235</a>
          </p>
        )}
      </div>
      <noscript>
        <p>
          To send this form, enable JavaScript or{" "}
          <a href="tel:+16617460235">call (661) 746-0235</a>.
        </p>
      </noscript>
    </form>
  );
}

export default ContactForm;
