import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>Next.js migration started</h1>
      <p>
        This is a starter shell. Legacy pages remain available while we migrate section by section.
      </p>
      <ul>
        <li><Link href="/gallery">New gallery route</Link></li>
        <li><Link href="/admin">New admin route</Link></li>
        <li><a href="/legacy/index.html">Legacy home</a></li>
        <li><a href="/legacy/gallery.html">Legacy gallery</a></li>
        <li><a href="/legacy/admin.html">Legacy admin</a></li>
      </ul>
    </main>
  );
}
