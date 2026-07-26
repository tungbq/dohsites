import type { CuratedProject } from "@/types/github";

// `repo` must match the GitHub repo name exactly (case-insensitive join in
// scripts/fetch-github-data.mjs). `blurb` is hand-written -- do not copy the
// GitHub description verbatim.
export const projects: CuratedProject[] = [
  {
    repo: "devops-basics",
    title: "DevOps Basics",
    blurb:
      "A practical, docs-first reference for the DevOps toolchain: CI/CD, containers, IaC, and monitoring, organized for day-to-day lookup rather than tutorial reading.",
    category: "Basics",
    impact: "1.8k+ stars, the most-referenced entry point into the collection",
    featured: true,
    order: 1,
    tags: ["ci-cd", "docker", "terraform", "kubernetes", "monitoring"],
  },
  {
    repo: "AWSHub",
    title: "AWS Hub",
    blurb:
      "A curated set of AWS service notes and learning resources, structured around the topics that come up most when studying for AWS certifications.",
    category: "Hubs",
    impact: "Aligned with AWS Solutions Architect Associate exam topics",
    featured: true,
    order: 2,
    tags: ["aws", "certification", "cloud", "documentation"],
  },
  {
    repo: "devops-toolkit",
    title: "DevOps Toolkit",
    blurb:
      "A single container image bundling Ansible, Terraform, kubectl, Helm, and the AWS/Azure CLIs, so a DevOps environment is one `docker pull` away instead of a local install checklist.",
    category: "Toolkit",
    impact: "Security-first base image, published to Docker Hub",
    featured: true,
    order: 3,
    tags: ["docker", "ansible", "terraform", "kubernetes", "aws", "azure"],
  },
  {
    repo: "devops-project",
    title: "DevOps Project Collection",
    blurb:
      "A set of self-contained DevOps projects covering AWS, Azure, containers, and CI/CD, built to practice putting individual tools together into something that resembles real infrastructure.",
    category: "Labs",
    featured: false,
    order: 4,
    tags: ["aws", "azure", "cicd", "terraform", "docker"],
  },
  {
    repo: "devops-practice",
    title: "DevOps Practice",
    blurb:
      "Hands-on exercises for building DevOps muscle memory -- short, focused tasks rather than long-form tutorials.",
    category: "Practice",
    featured: false,
    order: 5,
    tags: ["cicd", "learning"],
  },
  {
    repo: "aws-lab-with-terraform",
    title: "AWS Labs with Terraform",
    blurb:
      "Terraform code for common AWS lab scenarios, written to be read and modified rather than run as a black box.",
    category: "Labs",
    featured: false,
    order: 6,
    tags: ["aws", "terraform", "iac"],
  },
  {
    repo: "K8sHub",
    title: "K8s Hub",
    blurb:
      "Kubernetes deployment samples and practices collected from real troubleshooting sessions, kept runnable rather than purely illustrative.",
    category: "Hubs",
    featured: false,
    order: 7,
    tags: ["kubernetes", "deployment"],
  },
  {
    repo: "repos",
    title: "Repos Landscape",
    blurb:
      "A small tool that generates an overview of a GitHub account's repository landscape -- the seed idea behind this portfolio's own project grid.",
    category: "Tools",
    featured: false,
    order: 8,
    tags: ["github", "github-actions", "automation"],
  },
  {
    repo: "cmd",
    title: "Command Bookmarks",
    blurb:
      "A running bookmark of shell commands reached for often enough to be worth not re-Googling every time.",
    category: "Tools",
    featured: false,
    order: 9,
    tags: ["cli", "cheatsheet"],
  },
  {
    repo: "awesome-workflow",
    title: "Awesome GitHub Workflows",
    blurb:
      "A curated list of GitHub Actions workflows worth stealing, organized by what they automate rather than by popularity.",
    category: "Tools",
    featured: false,
    order: 10,
    tags: ["github-actions", "ci-cd", "automation"],
  },
  {
    repo: "find-github-issue",
    title: "Find GitHub Issue",
    blurb:
      "Filters for finding approachable open-source issues to contribute to, built after one too many dead-end searches through mislabeled backlogs.",
    category: "Tools",
    featured: false,
    order: 11,
    tags: ["open-source", "github"],
  },
  {
    repo: "useful-tools",
    title: "Useful Tools",
    blurb:
      "A running list of tools worth keeping around, added whenever something earns a permanent spot in the toolbox.",
    category: "Tools",
    featured: false,
    order: 12,
    tags: ["tooling"],
  },
  {
    repo: "devops-dockerfiles",
    title: "DevOps Dockerfiles",
    blurb:
      "A small collection of Dockerfiles for common DevOps tools, written to be copied into other projects rather than used as-is.",
    category: "Toolkit",
    featured: false,
    order: 13,
    tags: ["docker", "dockerfile"],
  },
  {
    repo: "terraform-sample-project",
    title: "Terraform Sample Project",
    blurb:
      "A Terraform project laid out around module structure and state management conventions worth reusing on new infrastructure.",
    category: "Labs",
    featured: false,
    order: 14,
    tags: ["terraform", "iac"],
  },
  {
    repo: "Azure-DevOps-Pipeline",
    title: "Azure DevOps Pipeline",
    blurb:
      "Working examples of Azure DevOps pipelines, kept around as a reference for YAML syntax that's easy to forget between projects.",
    category: "Labs",
    featured: false,
    order: 15,
    tags: ["azure", "cicd"],
  },
];
