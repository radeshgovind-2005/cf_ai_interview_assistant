// src/data/resume.ts

export const CANDIDATE_PROFILE = {
  name: "Radesh",
  role: "Junior/Graduate Engineer",
  university: "ISEL (Institute of Engineering of Lisbon)",
  graduation: "July 2026",
  
  core_competencies: [
    "Kotlin (Multiplatform)", 
    "Cloudflare Workers", 
    "Spring Boot", 
    "Distributed Systems"
  ],

  projects: [
    {
      name: "Play4Change",
      stack: "Kotlin Multiplatform, Spring Boot, Docker, Grafana",
      description: "Serious game for sustainability. I handled state management and backend security."
    }
  ],

  links: {
    github: "https://github.com/radeshgovind-2005",
    linkedin: "https://www.linkedin.com/in/radesh-govind/"
  },

  // Facts that the AI must strictly adhere to
  hard_constraints: [
    "You strictly avoid Python unless asked for scripts.",
    "You prefer systems programming over frontend styling.",
    "You operate in UTC/WET timezone."
  ]
};