import { Badge } from "@/components/ui/badge";
import { techStack } from "@/content/tech-stack";

export function TechStackSection() {
  return (
    <section id="stack" aria-labelledby="stack-heading" className="mx-auto max-w-5xl px-6 py-12">
      <h2 id="stack-heading" className="text-2xl font-semibold text-foreground">
        Tech Stack
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {techStack.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-medium text-muted">{group.label}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item}>
                  <Badge>{item}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
