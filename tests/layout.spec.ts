import { test, expect } from "@playwright/test"

test.describe("Main Layout & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the initial user check (me endpoint) to be unauthenticated initially
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Not authenticated" }),
      })
    })
  })

  test("persistent layout stays mounted during navigation", async ({ page }) => {
    // 1. Mock Login
    await page.route("**/api/v1/users/token", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Set-Cookie": "access_token=test-token; HttpOnly; Path=/; SameSite=Lax",
        },
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "test-token", // Still returning it for compatibility
          token_type: "bearer",
          user: { id: "1", username: "testuser", email: "test@example.com" },
        }),
      })
    })

    // 2. Mock successful profile check after login
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "1", username: "testuser", email: "test@example.com" }),
      })
    }, { times: 10 }) // Allow multiple calls

    // 3. Mock data endpoints
    await page.route("**/api/v1/tasks/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })
    await page.route("**/api/v1/stats/overview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_stats: { total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_percentage: 0 },
          tag_distribution: []
        })
      })
    })
    await page.route("**/api/v1/groups/", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })
    await page.route("**/api/v1/audit/logs*", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })

    await test.step("Login to the application", async () => {
      await page.goto("/login")
      await page.getByLabel(/email address/i).fill("test@example.com")
      await page.getByLabel(/password/i).fill("Password123!")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/dashboard$/)
    })

    await test.step("Verify persistent elements are visible", async () => {
      await expect(page.getByRole("heading", { name: /welcome back, testuser/i })).toBeVisible()
      await expect(page.getByRole("button", { name: /create task/i })).toBeVisible()
      await expect(page.getByRole("complementary")).toBeVisible() // Sidebar is an <aside> which usually has role 'complementary'
    })

    await test.step("Navigate to profile and back, ensuring layout persistence", async () => {
      // Mark the sidebar with a custom attribute to verify it doesn't re-mount
      await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (sidebar) sidebar.setAttribute('data-persistent', 'true');
      });

      // Click Profile in sidebar (need to find the link)
      // Based on TopNav code, it's in a dropdown, but let's check Sidebar links
      const profileLink = page.getByRole('link', { name: /profile/i });
      if (await profileLink.isVisible()) {
          await profileLink.click();
      } else {
          // Fallback to TopNav dropdown if sidebar link isn't direct
          await page.getByRole('button', { name: /testuser/i }).click(); // User initial button
          await page.getByRole('button', { name: /profile settings/i }).click();
      }

      await expect(page).toHaveURL(/\/profile$/);
      
      // Verify sidebar still has our custom attribute (proves it didn't re-mount)
      const sidebarPersistence = await page.getAttribute('aside', 'data-persistent');
      expect(sidebarPersistence).toBe('true');

      // Navigate back to dashboard
      await page.getByRole('link', { name: /dashboard/i }).first().click();
      await expect(page).toHaveURL(/\/dashboard$/);
      
      // Still persistent
      const sidebarPersistenceBack = await page.getAttribute('aside', 'data-persistent');
      expect(sidebarPersistenceBack).toBe('true');
    })

    await test.step("Verify sidebar collapse toggle", async () => {
        const sidebar = page.locator('aside');
        const initialWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
        
        // Find toggle button - usually a button with a chevron
        const toggleButton = page.locator('aside button').filter({ has: page.locator('svg') }).first();
        await toggleButton.click();
        
        // Wait for transition
        await page.waitForTimeout(500);
        
        const collapsedWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
        expect(collapsedWidth).toBeLessThan(initialWidth);
        expect(collapsedWidth).toBeCloseTo(72, 0); // UI-SPEC says 72px
    })
  })
})
