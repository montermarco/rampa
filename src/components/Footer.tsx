import { useTranslations } from "next-intl";
import { site } from "@/data/site";
import styles from "./Footer.module.css";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className={`${styles.footer} mono`}>
      <a href={site.instagram} target="_blank" rel="noopener noreferrer">
        {t("instagram")}
      </a>
      <a href={`mailto:${site.email}`}>{site.email}</a>
    </footer>
  );
}
