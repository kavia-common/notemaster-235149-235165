import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content" aria-label="Not found">
      <section className="panel" role="alert" aria-live="assertive">
        <header className="panelBody">
          <h1 style={{ fontSize: 18, fontWeight: 850, letterSpacing: 0.2 }}>404 – Page Not Found</h1>
          <p className="helpText" style={{ marginTop: 8 }}>
            The page you’re looking for doesn’t exist.
          </p>
          <p className="helpText" style={{ marginTop: 6 }}>
            Return to{" "}
            <Link href="/" style={{ textDecoration: "underline" }}>
              Home
            </Link>
            .
          </p>
        </header>
      </section>
    </main>
  );
}
