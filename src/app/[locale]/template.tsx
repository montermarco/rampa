import styles from "./template.module.css";

// Un template se vuelve a montar en cada navegación, así que la animación CSS
// de entrada corre en cada página (excepto en la carga inicial, ver el CSS). El fundido de salida vive en AppShell.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
