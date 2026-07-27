import Image from "next/image";
import { Stat } from "@/components/ui/stat";
import { siteConfig } from "@/lib/site-config";
import type { ProfileStats } from "@/types/github";

export function HeroSection({ stats }: { stats: ProfileStats }) {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 sm:flex-row sm:items-center">
      <Image
        src={`${stats.avatarUrl}&s=256`}
        alt={`${siteConfig.author} avatar`}
        width={128}
        height={128}
        priority
        className="h-32 w-32 shrink-0 rounded-full border-2 border-accent-2/30 shadow-lg shadow-accent-2/10"
      />

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">{siteConfig.author}</h1>
          <p className="mt-1 text-lg text-accent">DevOps Engineer</p>
          <p className="mt-3 max-w-xl text-muted">{siteConfig.tagline}</p>
        </div>

        <div className="flex gap-3">
          <a
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-md"
          >
            GitHub
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <a
            href="#projects"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2 hover:shadow-lg hover:shadow-accent-2/30"
          >
            View projects
          </a>
        </div>

        <div className="flex gap-8">
          <Stat label="Public repos" value={stats.publicRepos} />
          <Stat label="Followers" value={stats.followers} />
          <Stat label="Total stars" value={stats.totalStars} />
        </div>
      </div>
    </section>
  );
}
