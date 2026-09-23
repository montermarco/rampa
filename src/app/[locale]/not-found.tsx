import { useTranslations } from "next-intl";
import TransitionLink from "@/components/TransitionLink";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div style={{ padding: "calc(var(--header-height) + 18vh) var(--margin) 0" }}>
      <h1>{t("title")}</h1>
      <p style={{ marginTop: 12 }}>
        <TransitionLink href="/" style={{ color: "var(--secondary)" }}>
          {t("back")}
        </TransitionLink>
      </p>
    </div>
  );
}
