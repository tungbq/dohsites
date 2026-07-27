export interface TechStackItem {
  name: string;
  // Curated project tags that must ALL be present (AND) for a project to
  // count toward this item. Empty array = no count shown (no curated
  // project tagged with it yet, e.g. Helm) rather than a misleading "0".
  tagMatch: string[];
}

export interface TechStackGroup {
  label: string;
  items: TechStackItem[];
}

export const techStack: TechStackGroup[] = [
  {
    label: "Infrastructure as Code",
    items: [
      { name: "Terraform", tagMatch: ["terraform"] },
      { name: "Ansible", tagMatch: ["ansible"] },
    ],
  },
  {
    label: "Orchestration & Containers",
    items: [
      { name: "Kubernetes", tagMatch: ["kubernetes"] },
      { name: "Docker", tagMatch: ["docker"] },
      { name: "Helm", tagMatch: [] },
    ],
  },
  {
    label: "Cloud",
    items: [
      { name: "AWS", tagMatch: ["aws"] },
      { name: "Azure", tagMatch: ["azure"] },
    ],
  },
  {
    label: "CI/CD",
    items: [
      { name: "GitHub Actions", tagMatch: ["github-actions"] },
      { name: "Azure DevOps Pipelines", tagMatch: ["azure-pipelines"] },
    ],
  },
  {
    label: "Observability",
    items: [{ name: "Monitoring & Alerting", tagMatch: ["monitoring"] }],
  },
];
