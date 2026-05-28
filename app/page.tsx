import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>Jelle Wijma</h1>
      <p>Web development and photography portfolio, now fully served through Next.js routes.</p>
      <ul>
        <li><Link href="/gallery">Gallery</Link></li>
        <li><Link href="/admin">Admin</Link></li>
      </ul>
      <section>
        <h2>About</h2>
        <p>
          I build clean, responsive websites and visual concepts with attention to layout, motion,
          usability, and the story an image can carry.
        </p>
      </section>
    </main>
  );
}
