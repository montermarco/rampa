"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { site } from "@/data/site";
import styles from "./ContactForm.module.css";

type Status = "idle" | "sending" | "success" | "invalid" | "tooMany" | "error";

/** Formulario de contacto: envía a /api/contact. Incluye un honeypot ("website"). */
export default function ContactForm() {
  const t = useTranslations("form");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (response.ok) {
        form.reset();
        setStatus("success");
      } else if (response.status === 400) setStatus("invalid");
      else if (response.status === 429) setStatus("tooMany");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const messages: Partial<Record<Status, string>> = {
    success: t("success"),
    invalid: t("invalid"),
    tooMany: t("tooMany"),
    error: t("error", { email: site.email }),
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate={false}>
      <h2 className={`${styles.title} mono`}>{t("title")}</h2>

      <label className={styles.field}>
        <span className="mono">{t("name")}</span>
        <input name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" />
      </label>
      <label className={styles.field}>
        <span className="mono">{t("email")}</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label className={styles.field}>
        <span className="mono">{t("message")}</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={5} />
      </label>

      {/* Honeypot: fuera de la vista y del orden de tabulación. Los bots lo llenan. */}
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className={styles.actions}>
        <button type="submit" className={`${styles.button} mono`} disabled={status === "sending"}>
          {status === "sending" ? t("sending") : t("send")}
        </button>
        <p className={styles.status} role="status" aria-live="polite">
          {messages[status]}
        </p>
      </div>
    </form>
  );
}
