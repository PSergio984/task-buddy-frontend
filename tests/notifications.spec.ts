import { test, expect } from "@playwright/test"

test.describe("Notifications", () => {
  const mockNotifications = [
    {
      id: 1,
      user_id: 1,
      title: "Task Due Soon",
      body: "Your task 'Finish report' is due in 1 hour.",
      type: "REMINDER_BEFORE",
      priority: 2,
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 1,
      title: "System Update",
      body: "Maintenance scheduled for tonight.",
      type: "SYSTEM",
      priority: 1,
      read: true,
      created_at: new Date().toISOString(),
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Pre-seed authentication state
    await page.addInitScript(() => {
      globalThis.localStorage.setItem('auth_user', JSON.stringify({ id: "1", username: "testuser", email: "test@example.com" }));
    });

    // Mock authentication
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "1", username: "testuser", email: "test@example.com" }),
      })
    })

    // Mock Notifications List
    await page.route("**/api/v1/notifications/*", async (route) => {
      const url = route.request().url();
      if (url.includes("/vapid-key")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ public_key: "test-vapid-key" }),
        });
      }
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: mockNotifications, total: 2 }),
        });
      }
      if (route.request().method() === "PATCH" && url.includes("/read")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockNotifications[0], read: true }),
        });
      }
      await route.continue();
    });

    // Mock other common dashboard requests to avoid 404s
    await page.route("**/api/v1/tasks/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/api/v1/projects/", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/api/v1/stats/overview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_stats: { total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_percentage: 0 },
          tag_distribution: []
        })
      });
    });
    await page.route("**/api/v1/audit/logs*", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })

    await page.goto("/dashboard");
    await expect(page.locator('text=Syncing your workspace...')).not.toBeVisible({ timeout: 15000 });
  });

  test("should show notification bell with unread count", async ({ page }) => {
    const bell = page.locator('button:has(svg.lucide-bell)');
    await expect(bell).toBeVisible();
    
    // The unread count should be 1
    const badge = bell.locator('span.bg-destructive');
    await expect(badge).toHaveText("1");
  });

  test("should show notifications in popover", async ({ page }) => {
    const bell = page.locator('button:has(svg.lucide-bell)');
    await bell.click();

    await expect(page.getByText("Task Due Soon")).toBeVisible();
    await expect(page.getByText("System Update")).toBeVisible();
  });

  test("should show push notification toggle in profile", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");
    
    // Check for push notification section
    await expect(page.getByText(/push notifications/i)).toBeVisible();
    
    // Note: Actually toggling it might fail in headless chrome because service worker / push manager is not fully supported or requires permissions
    const toggleButton = page.getByRole('button', { name: /enable/i }).first();
    await expect(toggleButton).toBeVisible();
  });
});
