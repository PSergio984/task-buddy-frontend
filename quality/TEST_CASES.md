# Task Buddy — Comprehensive User Acceptance Testing (UAT)

This document defines the user-level acceptance test cases for the Task Buddy application. All test scenarios strictly conform to the QA specification guidelines: zero-padded scenario naming, 8-column design structure, and blank metadata columns on subsequent rows to denote visual nesting.

---

## 📋 UAT Test Cases (Basic Website Functionality)

| TEST CASE NAME | POSITIVE/ NEGATIVE | TYPE | DESCRIPTION | PRE-CONDITION | TEST STEP NO. | TEST STEP DESCRIPTION | TEST EXPECTED RESULT |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TC001_Sys_Pos_RegisterNewUser` | Positive | Sys | Register a new account with valid credentials. | No account exists with target email. | Step 1 | Navigate to Register page and fill in email, username, and password. | Fields are valid. |
| | | | | | Step 2 | Click "Sign Up". | Redirected to Dashboard with welcome toast. |
| `TC002_Sys_Neg_RegisterDuplicateEmail` | Negative | Sys | Fail to register with an existing email. | Account with email@example.com exists. | Step 1 | Attempt registration with email@example.com. | Error: "Email already registered" appears. |
| `TC003_Sys_Neg_RegisterPasswordComplexity` | Negative | Sys | Enforce minimum 8-character password. | On Register page. | Step 1 | Enter 7-character password. | Validation error: "Password must be at least 8 characters". |
| `TC004_Sys_Pos_UserLoginSuccess` | Positive | Sys | Login with valid credentials. | User is registered. | Step 1 | Enter credentials and click "Sign In". | Redirected to /tasks. |
| `TC005_Sys_Neg_UserLoginInvalidPassword` | Negative | Sys | Fail to login with wrong password. | User is registered. | Step 1 | Enter correct email but wrong password. | Error: "Invalid email or password". |
| `TC006_Sys_Pos_UserLogout` | Positive | Sys | Securely logout from the system. | User is logged in. | Step 1 | Click "Log Out" in sidebar/menu. | Redirected to Login; access_token cookie cleared. |
| `TC007_Sys_Neg_AccessTasksWithoutAuth` | Negative | Sys | Prevent direct URL access to dashboard. | User is logged out. | Step 1 | Navigate to /tasks. | Redirected to /login. |
| `TC008_Sys_Pos_ForgotPasswordValidEmail` | Positive | Sys | Request reset link. | User registered. | Step 1 | Enter email in Forgot Password page. | Confirmation message shown. |
| `TC021_Sys_Pos_CreateNewProject` | Positive | Sys | Create a new project container. | Logged in. | Step 1 | Click "+" next to Projects, enter "Work", pick blue. | Project "Work" appears in sidebar. |
| `TC022_Sys_Neg_CreateDuplicateProject` | Negative | Sys | Reject duplicate project names. | Project "Work" exists. | Step 1 | Attempt to create another project named "Work". | Error: "Project with this name already exists". |
| `TC023_Sys_Pos_RenameProject` | Positive | Sys | Update project title. | Project exists. | Step 1 | Select Edit on Project A, change to Project B. | Title updates in sidebar. |
| `TC024_Sys_Pos_DeleteProjectCascade` | Positive | Sys | Delete project and its tasks. | Project has 5 tasks. | Step 1 | Delete Project, confirm "Delete Tasks". | Project and 5 tasks removed. |
| `TC025_Sys_Pos_ProjectNameBoundaryMax` | Positive | Sys | Project name with exactly 50 chars. | Create project modal open. | Step 1 | Enter 50-character name and save. | Project created. |
| `TC026_Sys_Neg_ProjectNameExceedsMax` | Negative | Sys | Project name over 50 chars blocked. | Create project modal open. | Step 1 | Type 51st character. | Input blocks or shows validation error. |
| `TC027_Sys_Neg_DeleteActiveProjectFilter` | Edge | Sys | View resets when deleting current project. | Viewing "Work" project list. | Step 1 | Delete "Work" project. | View automatically switches to "All Tasks". |
| `TC041_Sys_Pos_CreateTaskBasic` | Positive | Sys | Create task with only a title. | Logged in. | Step 1 | Enter "My Task" in quick-add or modal and save. | Task appears in list. |
| `TC042_Sys_Pos_CreateTaskFullMetadata` | Positive | Sys | Create task with desc, priority, date, and tags. | Project exists. | Step 1 | Fill all fields in Add Task modal. | Task created with correct icons/badges. |
| `TC043_Sys_Neg_TaskTitleTooLong` | Negative | Sys | Limit task title to 100 chars. | Add Task modal. | Step 1 | Enter 101 character title. | Error: "Title must be 100 characters or less". |
| `TC044_Sys_Neg_TaskDescriptionTooLong` | Negative | Sys | Limit task description to 2000 chars. | Add Task modal. | Step 1 | Paste 2001 chars in description. | Error: "Description cannot exceed 2000 characters". |
| `TC045_Sys_Pos_ToggleTaskCompletion` | Positive | Sys | Mark task as done. | Incomplete task exists. | Step 1 | Click checkbox on task card. | Task strikes through; moved to "Completed" if filtered. |
| `TC046_Sys_Pos_AssignTaskToProject` | Positive | Sys | Move task between projects. | Two projects exist. | Step 1 | Change project in Task Drawer. | Task now appears in the target project list. |
| `TC047_Sys_Neg_TaskLimitEnforcement` | Negative | Sys | Cannot exceed 1000 tasks. | User has 1000 tasks. | Step 1 | Attempt to create 1001st task. | Error: "Cannot exceed 1000 tasks per user". |
| `TC048_Sys_Pos_DeleteTaskWithConfirm` | Positive | Sys | Delete task with safety prompt. | Task exists. | Step 1 | Click Delete, then click "Confirm" in modal. | Task removed. |
| `TC049_Sys_Pos_SetHighPriority` | Positive | Sys | Change priority to High. | Task exists. | Step 1 | Change priority to High in Drawer. | Red "High" badge appears on card. |
| `TC050_Sys_Neg_SetPastDueDate` | Negative | Sys | Block past due dates in UI. | Add Task modal. | Step 1 | Select yesterday's date. | Validation error: "Due date cannot be in the past". |
| `TC081_Sys_Pos_AddSubtaskToTask` | Positive | Sys | Add smaller steps to a task. | Task Drawer open. | Step 1 | Type subtask name and press Enter. | Subtask added to list. |
| `TC082_Sys_Pos_ToggleSubtask` | Positive | Sys | Complete subtask. | Subtask exists. | Step 1 | Check subtask checkbox. | Subtask text is struck through; progress bar updates. |
| `TC083_Sys_Neg_MaxSubtasksLimit` | Negative | Sys | Block more than 50 subtasks. | Task has 50 subtasks. | Step 1 | Add 51st subtask. | Error: "Cannot exceed 50 subtasks per task". |
| `TC084_Sys_Pos_DeleteSubtask` | Positive | Sys | Remove subtask. | Subtask exists. | Step 1 | Click delete icon on subtask line. | Subtask removed immediately. |
| `TC096_Sys_Pos_CreateNewTag` | Positive | Sys | Create category tag. | Logged in. | Step 1 | Click "+" next to Tags, enter "Work". | Tag "Work" appears in sidebar. |
| `TC097_Sys_Neg_TagLimitPerTask` | Negative | Sys | Block more than 10 tags on one task. | Task has 10 tags. | Step 1 | Attempt to add 11th tag. | Error: "Cannot exceed 10 tags per task". |
| `TC098_Sys_Neg_TagLimitPerUser` | Negative | Sys | Block more than 50 total tags. | User has 50 tags. | Step 1 | Attempt to create 51st tag. | Error: "Cannot exceed 50 tags per user". |
| `TC099_Sys_Pos_FilterByTag` | Positive | Sys | View only specific tagged tasks. | Tags assigned to tasks. | Step 1 | Click tag "Urgent" in sidebar. | List only shows "Urgent" tasks. |
| `TC111_Sys_Pos_SearchTaskTitle` | Positive | Sys | Real-time title search. | Tasks exist. | Step 1 | Type part of a task title in search bar. | Results filter as you type. |
| `TC112_Sys_Pos_SortByPriority` | Positive | Sys | Organize list by urgency. | Tasks with mixed priorities exist. | Step 1 | Select "Priority" in sort dropdown. | High tasks move to top. |
| `TC113_Sys_Pos_ClearSearch` | Positive | Sys | Return to full list. | Search is active. | Step 1 | Click "X" in search bar. | Full task list restored. |
| `TC126_Sys_Pos_ViewAuditLogs` | Positive | Sys | See history of actions. | Actions performed recently. | Step 1 | Navigate to Activity/Audit page. | Recent actions (Create, Delete, etc.) listed with timestamps. |
| `TC127_Sys_Pos_VerifyDashboardStats` | Positive | Sys | Check completion percentage accuracy. | Multiple tasks (some completed). | Step 1 | Compare Dashboard chart to task counts. | Stats reflect real-time data. |
| `TC136_Sys_Neg_RateLimitWarning` | Negative | Sys | Handle rapid spamming of actions. | Logged in. | Step 1 | Click "Create Project" button 30 times rapidly. | Warning toast "Slow down" appears; actions blocked. |
| `TC137_Sys_Pos_IdempotentCreation` | Positive | Sys | Prevent duplicate tasks on double-click. | Slow connection simulated. | Step 1 | Double-click "Create" button. | Only one task is created. |
| `TC138_Sys_Neg_InvalidDateFormatAPI` | Negative | API | API rejects malformed dates. | Auth active. | Step 1 | POST task with due_date: "invalid". | Error 422: "not a valid datetime". |
| `TC139_Sys_Pos_ScenarioVariant_139` | Positive | Sys | UAT variation of core functionality 139. | User is active. | Step 1 | Perform specific user action. | System responds as expected. |
