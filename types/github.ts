export interface RepoStats {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  htmlUrl: string;
  pushedAt: string;
  archived: boolean;
}

export interface ProfileStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
}

export interface GithubData {
  generatedAt: string;
  profile: ProfileStats;
  repos: Record<string, RepoStats>;
}

export type ProjectCategory =
  | "Basics"
  | "Labs"
  | "Practice"
  | "Toolkit"
  | "Hubs"
  | "Tools";

export interface CuratedProject {
  repo: string;
  title: string;
  blurb: string;
  category: ProjectCategory;
  impact?: string;
  featured: boolean;
  order: number;
  tags: string[];
}

export type Project = CuratedProject & { stats: RepoStats };
