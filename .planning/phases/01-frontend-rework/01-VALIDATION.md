### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.ts` |
| Quick run command | `npm run test:e2e` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Sidebar persists across navigation | e2e | `npx playwright test` | ❌ Wave 0 |
| UI-02 | TopNav has standard copy "Create Task" | e2e | `npx playwright test` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Update E2E tests for the changed copy ("Forge Task" -> "Create Task").
- [ ] Create UI transition tests to ensure layout components do not unmount.
