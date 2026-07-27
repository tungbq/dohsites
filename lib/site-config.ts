export const siteConfig = {
  name: "tungbq",
  title: "tungbq | DevOps Engineer",
  // Third-person, keyword-bearing -- this one feeds <meta description>, OG,
  // and JSON-LD, where search engines read it. The hero uses `tagline`.
  description:
    "Portfolio of tungbq, a DevOps engineer in Ho Chi Minh City working with Kubernetes, Terraform, AWS, and Azure.",
  // First-person, human-facing -- what a visitor reads at the top of the page.
  tagline:
    "I build infrastructure that's reproducible, observable, and safe to change — then write down how it works, so the next person doesn't have to reverse-engineer it.",
  url: "https://tungbq.github.io/me",
  author: "Tung Leo",
  email: "tung.bquang@gmail.com",
  location: {
    addressLocality: "Ho Chi Minh City",
    addressCountry: "VN",
  },
  keywords: [
    "DevOps",
    "Kubernetes",
    "Terraform",
    "AWS",
    "Azure",
    "Infrastructure as Code",
    "CI/CD",
    "Portfolio",
  ],
  socials: {
    github: "https://github.com/tungbq",
    linkedin: "https://www.linkedin.com/in/tungbq/",
    x: "https://twitter.com/tunggbui",
    website: "https://thedevopshub.org",
  },
} as const;
