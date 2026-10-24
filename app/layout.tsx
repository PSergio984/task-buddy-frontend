import type { Metadata, Viewport } from "next"
import { InstallPrompt } from "@/components/install-prompt"
import "@fontsource-variable/geist"
import "../src/index.css"
import "react-datepicker/dist/react-datepicker.css"

export const metadata: Metadata = {
  title: "Task Buddy",
  description: "Premium Executive Task Management",
  icons: {
    icon: [
      { url: "/task-buddy-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F172A",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
