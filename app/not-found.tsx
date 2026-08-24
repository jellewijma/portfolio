import Link from "next/link";
import { WorkshopLights } from "./workshop/workshop-lights";
import styles from "./workshop/workshop.module.css";

const exits = [
  {
    number: "01",
    status: "sensible",
    statusClass: styles.shipped,
    title: "Go home",
    note: "Start over without losing your dignity.",
    href: "https://jellewijma.com",
  },
  {
    number: "02",
    status: "useful",
    statusClass: styles.building,
    title: "See the projects",
    note: "Visit the work that actually exists.",
    href: "https://jellewijma.com/projects",
  },
  {
    number: "03",
    status: "distraction",
    statusClass: styles.questionable,
    title: "Open the gallery",
    note: "Look at photographs while nobody mentions the URL.",
    href: "https://jellewijma.com/gallery",
  },
];

export default function NotFound() {
  return (
    <main className={styles.workshop}>
      <nav className={styles.nav} aria-label="404 navigation">
        <Link href="https://jellewijma.com" className={styles.wordmark}>
          JelleWijma
        </Link>
        <span className={styles.location}>
          <span className={styles.liveDot} aria-hidden="true" />
          Error 404
        </span>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>404 / wrong turn</p>
          <h1>Nothing lives here.</h1>
          <p className={styles.intro}>
            You found an address that does not exist. The site is fine. This particular bit of internet is just empty.
          </p>
          <div className={styles.actions}>
            <Link href="https://jellewijma.com" className={styles.primaryAction}>
              Back to the portfolio <span aria-hidden="true">→</span>
            </Link>
            <a href="#exits" className={styles.secondaryAction}>
              Other escape routes
            </a>
          </div>
        </div>

        <aside className={styles.notice} aria-label="Missing page notice">
          <div className={styles.tape} aria-hidden="true" />
          <p>Missing</p>
          <strong>This page slipped behind the workbench.</strong>
          <span>No project was harmed.</span>
          <WorkshopLights />
          <div className={styles.coffeeRing} aria-hidden="true" />
        </aside>
      </section>

      <section id="exits" className={styles.bench} aria-labelledby="exits-title">
        <header className={styles.benchHeader}>
          <div>
            <p className={styles.eyebrow}>Useful exits</p>
            <h2 id="exits-title">Try somewhere real</h2>
          </div>
          <p>The address bar accepts second attempts.</p>
        </header>

        <div className={styles.cards}>
          {exits.map((exit) => (
            <Link className={styles.card} href={exit.href} key={exit.number}>
              <div className={styles.cardTopline}>
                <span>{exit.number}</span>
                <span className={`${styles.status} ${exit.statusClass}`}>{exit.status}</span>
              </div>
              <h3>{exit.title}</h3>
              <p>{exit.note}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
