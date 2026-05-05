import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
    })
  })

  test("shows task-buddy branding and icon on auth pages", async ({ page }) => {
    await test.step("Verify login branding", async () => {
      await page.goto("/login")
      await expect(
        page.getByRole("heading", { name: /sign in to your account/i })
      ).toBeVisible()
      await expect(page.getByText("task-buddy")).toBeVisible()
      await expect(page.getByTestId("task-buddy-icon")).toBeVisible()
    })

    await test.step("Verify register branding", async () => {
      await page.goto("/register")
      await expect(
        page.getByRole("heading", { name: /create your account/i })
      ).toBeVisible()
      await expect(page.getByText("task-buddy")).toBeVisible()
      await expect(page.getByTestId("task-buddy-icon")).toBeVisible()
    })
  })

  test("login succeeds with a valid username and password", async ({
    page,
  }) => {
    await test.step("Mock the login endpoint", async () => {
      await page.route("**/api/v1/users/token", async (route) => {
        const body = route.request().postData() ?? ""
        const payload = new URLSearchParams(body)

        expect(payload.get("username")).toBe("demo.user")
        expect(payload.get("password")).toBe("Secret123!")

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "test-login-token",
            token_type: "bearer",
            user: { id: "user-1", username: "demo.user" },
          }),
        })
      })
    })

    await test.step("Submit the login form", async () => {
      await page.goto("/login")
      await page.getByLabel("Username").fill("demo.user")
      await page.getByLabel("Password", { exact: true }).fill("Secret123!")

      await expect(
        page.getByRole("button", { name: /sign in to task-buddy/i })
      ).toBeEnabled()

      await page.getByRole("button", { name: /sign in to task-buddy/i }).click()
    })

    await test.step("Verify the dashboard navigation", async () => {
      await expect(page).toHaveURL(/\/dashboard$/)
    })
  })

  test("register succeeds with valid fields and a sanitized username", async ({
    page,
  }) => {
    await test.step("Mock the registration endpoint", async () => {
      await page.route("**/api/v1/users/register", async (route) => {
        const payload = route.request().postDataJSON() as {
          username: string
          email: string
          password: string
        }

        expect(payload).toMatchObject({
          username: "demouserscript",
          email: "demo@example.com",
          password: "Secret123!",
        })

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "user-2", username: payload.username }),
        })
      })
    })

    await test.step("Fill and submit the registration form", async () => {
      await page.goto("/register")
      await page.getByLabel("Username").fill("demo user<script>")
      await page.getByLabel("Email").fill("demo@example.com")
      await page.getByLabel("Password", { exact: true }).fill("Secret123!")
      await page.getByLabel("Confirm Password").fill("Secret123!")

      await expect(
        page.getByRole("button", { name: /create your account/i })
      ).toBeEnabled()

      await page.getByRole("button", { name: /create your account/i }).click()
    })

    await test.step("Verify navigation returns to login", async () => {
      await expect(page).toHaveURL(/\/login$/)
    })
  })

  test("keeps the submit button disabled until the inputs are valid", async ({
    page,
  }) => {
    await page.goto("/register")

    await test.step("Assert the empty form is disabled", async () => {
      await expect(
        page.getByRole("button", { name: /complete the required fields/i })
      ).toBeDisabled()
    })

    await test.step("Reject an invalid email address", async () => {
      await page.getByLabel("Username").fill("demo.user")
      await page.getByLabel("Email").fill("invalid-email")
      await page.getByLabel("Password", { exact: true }).fill("Secret123!")
      await page.getByLabel("Confirm Password").fill("Secret123!")

      await expect(page.getByText("Enter a valid email address.")).toBeVisible()
      await expect(
        page.getByRole("button", { name: /complete the required fields/i })
      ).toBeDisabled()
    })
  })

  test("updates password strength indicator as password improves", async ({
    page,
  }) => {
    await page.goto("/register")

    const strengthLabel = page.getByText(/^Strength:/)
    const strengthBar = page.getByTestId("password-strength-bar")

    await test.step("Weak password shows weak state", async () => {
      await page.getByLabel("Password", { exact: true }).fill("abc")
      await expect(strengthLabel).toContainText("Very weak")
      await expect(strengthBar).toHaveAttribute("style", /width:\s*20%/)
    })

    await test.step("Stronger password upgrades strength state", async () => {
      await page.getByLabel("Password", { exact: true }).fill("Secret123!")
      await expect(strengthLabel).toContainText(/Fair|Good|Strong/)
      await expect(strengthBar).toHaveAttribute("style", /width:\s*80%/)
    })
  })
})
