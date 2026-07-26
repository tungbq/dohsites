import { about } from "@/content/about";

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto max-w-5xl px-6 py-12">
      <h2 id="about-heading" className="text-2xl font-semibold text-foreground">
        About
      </h2>
      <div className="mt-4 flex max-w-2xl flex-col gap-3 text-muted">
        {about.bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
