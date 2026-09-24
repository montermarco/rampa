import { useTranslations } from "next-intl";
import { site } from "@/data/site";
import styles from "./Footer.module.css";

export default function Footer() {
  const t = useTranslations("home");
  return (
    <footer className={styles.footer}>
      <p className={styles.statement}>{t("statement")}</p>
      <div className={`${styles.contact} label`}>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={site.instagram} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
      </div>
    </footer>
  );
}
