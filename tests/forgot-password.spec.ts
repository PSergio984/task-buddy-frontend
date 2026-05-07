import { test, expect } from "@playwright/test"

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password")
  })

  test("should display the forgot password form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reset Your Password" })).toBeVisible()
    await expect(page.getByLabel("Email Address")).toBeVisible()
    await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible()
  })

  test("should show error for invalid email", async ({ page }) => {
    const emailInput = page.getByLabel("Email Address")
    await emailInput.fill("invalid-email")
    await page.getByRole("button", { name: "Send Reset Link" }).click()
    await expect(page.getByText("Invalid email format")).toBeVisible()
  })

  test("should navigate back to login", async ({ page }) => {
    await page.getByRole("link", { name: "Back to sign in" }).click()
    await expect(page).toHaveURL("/login")
  })
})
