import type { Metadata } from "next";
import Link from "next/link";
import { WorkshopLights } from "./workshop-lights";
import styles from "./workshop.module.css";

export const metadata: Metadata = {
  title: "Jelle's Project Workshop",
  description: "A look behind the scenes at the things Jelle Wijma is building, shipping, and occasionally taking apart again.",
  alternates: {
    canonical: "https://project.jellewijma.com",
  },
  openGraph: {
    title: "You found the workshop.",
    description: "Finished work, live experiments, and the occasional bad idea by Jelle Wijma.",
    url: "https://project.jellewijma.com",
    type: "website",
    images: [{ url: "https://project.jellewijma.com/workshop-og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "You found the workshop.",
    description: "Finished work, live experiments, and the occasional bad idea by Jelle Wijma.",
    images: ["https://project.jellewijma.com/workshop-og.png"],
  },
};

const projects = [
  {
    number: "01",
    status: "shipped",
    title: "Porsche Club",
    note: "An editorial site concept for drives, events, and people who know the sound before they see the car.",
  },
  {
    number: "02",
    status: "building",
    title: "The proper archive",
    note: "A better home for web experiments, visual systems, and work that deserves more than one thumbnail.",
  },
  {
    number: "03",
    status: "questionable",
    title: "Unlabelled prototype",
    note: "It has too many tabs open, one surprisingly good interaction, and no sensible name yet.",
  },
];

export default function WorkshopPage() {
  return (
    <main className={styles.workshop}>
      <nav className={styles.nav} aria-label="Workshop navigation">
        <Link href="https://jellewijma.com" className={styles.wordmark}>
          JelleWijma
        </Link>
        <span className={styles.location}>
          <span className={styles.liveDot} aria-hidden="true" />
          Project workshop
        </span>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Door found / light on</p>
          <h1>You found the workshop.</h1>
          <p className={styles.intro}>
            The polished project archive is still on the bench. Until it is ready, this is where finished work, live experiments,
            and the occasional bad idea wait for their turn.
          </p>
          <div className={styles.actions}>
            <a href="#bench" className={styles.primaryAction}>
              Inspect the bench <span aria-hidden="true">↓</span>
            </a>
            <Link href="https://jellewijma.com" className={styles.secondaryAction}>
              Back to the portfolio
            </Link>
          </div>
        </div>

        <aside className={styles.notice} aria-label="Workshop notice">
          <div className={styles.tape} aria-hidden="true" />
          <p>Temporary sign</p>
          <strong>Good work takes a minute.</strong>
          <span>The coffee does not.</span>
          <WorkshopLights />
          <div className={styles.coffeeRing} aria-hidden="true" />
        </aside>
      </section>

      <section id="bench" className={styles.bench} aria-labelledby="bench-title">
        <header className={styles.benchHeader}>
          <div>
            <p className={styles.eyebrow}>On the bench</p>
            <h2 id="bench-title">Current state of things</h2>
          </div>
          <p>Last checked while pretending not to check the time.</p>
        </header>

        <div className={styles.cards}>
          {projects.map((project) => (
            <article className={styles.card} key={project.number}>
              <div className={styles.cardTopline}>
                <span>{project.number}</span>
                <span className={`${styles.status} ${styles[project.status]}`}>{project.status}</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Nothing here is client-confidential. The mysterious bits are mysterious because I have not named them yet.
        </p>
        <div>
          <Link href="https://github.com/jellewijma">GitHub</Link>
          <Link href="https://jellewijma.com/about">About Jelle</Link>
        </div>
      </footer>
    </main>
  );
}
