import type { Metadata, Viewport } from "next"
import "@fontsource-variable/geist"
import "../src/index.css"
import "react-datepicker/dist/react-datepicker.css"

export const metadata: Metadata = {
  title: "Task Buddy",
  description: "Premium Executive Task Management",
  icons: {
    icon: "/task-buddy-icon.svg",
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
      <body>{children}</body>
    </html>
  )
}
