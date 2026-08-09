import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Task Buddy",
    short_name: "TaskBuddy",
    description: "Premium Executive Task Management",
    theme_color: "#0F172A",
    background_color: "#0F172A",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/task-buddy-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
