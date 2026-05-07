import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should display the hero section", async ({ page }) => {
    await expect(page.getByText("Master Your Time,")).toBeVisible()
    await expect(page.getByText("Stay Productive")).toBeVisible()
  })

  test("should navigate to login page when clicking sign in", async ({ page }) => {
    await page.getByRole("link", { name: "Sign In" }).click()
    await expect(page).toHaveURL("/login")
  })

  test("should navigate to register page when clicking get started", async ({ page }) => {
    await page.getByRole("link", { name: "Get Started Free" }).first().click()
    await expect(page).toHaveURL("/register")
  })

  test("should display features section", async ({ page }) => {
    await expect(page.getByText("Seamless Organization")).toBeVisible()
    await expect(page.getByText("Secure & Private")).toBeVisible()
    await expect(page.getByText("Smart Insights")).toBeVisible()
  })
})
