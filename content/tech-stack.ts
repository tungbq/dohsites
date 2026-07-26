export interface TechStackGroup {
  label: string;
  items: string[];
}

export const techStack: TechStackGroup[] = [
  {
    label: "Infrastructure as Code",
    items: ["Terraform", "Ansible"],
  },
  {
    label: "Orchestration & Containers",
    items: ["Kubernetes", "Docker", "Helm"],
  },
  {
    label: "Cloud",
    items: ["AWS", "Azure"],
  },
  {
    label: "CI/CD",
    items: ["GitHub Actions", "Azure DevOps Pipelines"],
  },
  {
    label: "Observability",
    items: ["Monitoring & Alerting"],
  },
];
