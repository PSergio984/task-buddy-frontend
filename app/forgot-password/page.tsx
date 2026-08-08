import { NoSSR } from "@/components/no-ssr"
import { PublicForgotPassword } from "@/components/public-pages"
import { publicPageMetadata } from "../public-metadata"

export const metadata = publicPageMetadata(
  "Forgot Password | Task Buddy",
  "Reset your Task Buddy password."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicForgotPassword />
    </NoSSR>
  )
}
