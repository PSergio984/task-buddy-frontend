import type { Metadata } from "next"

export function publicPageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}
