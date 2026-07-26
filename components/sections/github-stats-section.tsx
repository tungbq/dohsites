import type { Project } from "@/types/github";

function topLanguages(projects: Project[], limit = 5) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const lang = project.stats.language;
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function GithubStatsSection({ projects }: { projects: Project[] }) {
  const languages = topLanguages(projects);
  if (languages.length === 0) return null;

  const totalTagged = languages.reduce((sum, [, count]) => sum + count, 0);

  return (
    <section
      aria-labelledby="github-stats-heading"
      className="mx-auto max-w-5xl px-6 py-12"
    >
      <h2 id="github-stats-heading" className="text-2xl font-semibold text-foreground">
        Top languages across curated projects
      </h2>
      <ul className="mt-6 flex max-w-xl flex-col gap-2">
        {languages.map(([language, count]) => (
          <li key={language} className="flex items-center gap-3">
            <span className="w-28 text-sm text-foreground">{language}</span>
            <div className="h-2 flex-1 rounded-full bg-surface">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(count / totalTagged) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
