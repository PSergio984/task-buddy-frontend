import { test, expect } from "@playwright/test"

test.describe("Sidebar DND Reordering", () => {
  const mockProjects = [
    { id: 1, name: "Project A", color: "#FF0000", icon: "briefcase", position: 1 },
    { id: 2, name: "Project B", color: "#00FF00", icon: "folder", position: 2 },
  ];

  const mockTags = [
    { id: 1, name: "Tag A", color: "#0000FF", position: 1 },
    { id: 2, name: "Tag B", color: "#FFFF00", position: 2 },
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

    // Mock Projects
    await page.route("**/api/v1/projects/", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProjects),
        });
      } else if (route.request().method() === "POST" && route.request().url().includes("/reorder")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Tags
    await page.route("**/api/v1/tags/", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockTags),
        });
      } else if (route.request().method() === "POST" && route.request().url().includes("/reorder")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock other common dashboard requests
    await page.route("**/api/v1/tasks/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/api/v1/stats/overview", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ task_stats: {}, tag_distribution: [] }) });
    });
    await page.route("**/api/v1/notifications/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], total: 0 }) });
    });
    await page.route("**/api/v1/audit/logs*", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })

    await page.goto("/dashboard");
    await expect(page.locator('text=Syncing your workspace...')).not.toBeVisible({ timeout: 15000 });
  });

  test("should allow reordering projects", async ({ page }) => {
    // This is a placeholder test that will be refined in Task 2
    const projectA = page.getByText("Project A");
    const projectB = page.getByText("Project B");
    
    await expect(projectA).toBeVisible();
    await expect(projectB).toBeVisible();
  });

  test("should allow reordering tags", async ({ page }) => {
    // This is a placeholder test that will be refined in Task 3
    const tagA = page.getByText("Tag A");
    const tagB = page.getByText("Tag B");
    
    await expect(tagA).toBeVisible();
    await expect(tagB).toBeVisible();
  });
});
