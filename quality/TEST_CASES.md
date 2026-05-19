# Unified Task Buddy Test Cases

This document defines the unified test cases for the Task Buddy application, focusing strictly on User Acceptance Testing (UAT). The test scenarios detail how a real user interacts with the UI and what results they should visually expect.

All test scenarios strictly conform to the QA specification guidelines: zero-padded scenario naming, 8-column design structure, and blank metadata columns on subsequent rows to denote visual nesting.

---

## 📋 Comprehensive Test Cases

| TEST CASE NAME | POSITIVE/ NEGATIVE | TYPE | DESCRIPTION | PRE-CONDITION | TEST STEP NO. | TEST STEP DESCRIPTION | TEST EXPECTED RESULT |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC001_Sys_Pos_RegisterUser | Positive | System | Validate registering a new user account. | Email not in use. | Step 1 | Navigate to the Register page. | Registration form is displayed. |
| | | | | | Step 2 | Enter valid name, email, and password, then submit. | User is registered, redirected to the Dashboard, and a success message is shown. |
| TC002_Sys_Neg_RegisterDuplicateEmail | Negative | System | Prevent registration with existing email. | Email already exists. | Step 1 | Navigate to the Register page. | Registration form is displayed. |
| | | | | | Step 2 | Enter an email that is already registered and submit. | Registration fails, and an "Email already in use" error is displayed in the UI. |
| TC003_Sys_Pos_UserLogin | Positive | System | Validate standard login flow. | User account exists. | Step 1 | Navigate to the Login page. | Login form is displayed. |
| | | | | | Step 2 | Enter valid credentials and click Sign In. | User is authenticated and redirected to the Dashboard. |
| TC004_Sys_Neg_UserLoginInvalid | Negative | System | Validate login with invalid credentials. | User account exists. | Step 1 | Navigate to the Login page. | Login form is displayed. |
| | | | | | Step 2 | Enter invalid credentials and click Sign In. | Login fails, and an "Invalid email or password" error is displayed. |
| TC005_Sys_Pos_GetMe | Positive | System | Verify retrieval of current user info. | User logged in. | Step 1 | Navigate to Settings or Profile page. | User's profile information (name, email) is displayed correctly. |
| TC006_Sys_Pos_UpdateUsername | Positive | System | Verify user can update username. | User logged in. | Step 1 | Navigate to Settings or Profile page. | Profile form is visible. |
| | | | | | Step 2 | Change the username and save. | A success message is shown, and the new username is reflected in the UI (e.g., Topnav). |
| TC007_Sys_Pos_UpdatePassword | Positive | System | Verify user can change password. | User logged in. | Step 1 | Navigate to Settings or Profile page. | Password update form is visible. |
| | | | | | Step 2 | Enter current password and new password, then save. | A success message indicates the password was changed successfully. |
| TC008_Sys_Pos_Logout | Positive | System | Verify user can logout and invalidate session. | User logged in. | Step 1 | Click the User Profile icon or menu. | User menu opens. |
| | | | | | Step 2 | Click "Logout". | User is logged out and redirected to the Landing/Login page. |
| TC009_Sys_Pos_CreateProject | Positive | System | Create a new project. | User logged in. | Step 1 | In the Sidebar, click the "+" or "Add Project" button. | "Create Project" modal or input appears. |
| | | | | | Step 2 | Enter project name, select a color, and save. | The new project appears in the Sidebar project list. |
| TC010_Sys_Pos_ListProjects | Positive | System | Retrieve all projects. | Projects exist. | Step 1 | View the Sidebar. | All existing projects associated with the user are listed correctly. |
| TC011_Sys_Pos_UpdateProject | Positive | System | Update project name or color. | Project exists. | Step 1 | Hover over a project in the Sidebar and click edit. | "Edit Project" modal appears. |
| | | | | | Step 2 | Change the project name or color and save. | The project in the Sidebar updates to reflect the new details. |
| TC012_Sys_Pos_DeleteProject | Positive | System | Delete a project. | Project exists. | Step 1 | Hover over a project in the Sidebar and click delete. | A confirmation modal appears. |
| | | | | | Step 2 | Confirm the deletion. | The project is removed from the Sidebar list. |
| TC013_Sys_Pos_ReorderProjects | Positive | System | Change order of projects. | Multiple projects. | Step 1 | Click and drag a project in the Sidebar. | The project can be dragged visually. |
| | | | | | Step 2 | Drop the project in a new position. | The new order is saved and reflected in the Sidebar. |
| TC014_Sys_Pos_CreateTask | Positive | System | Create a new task. | User logged in. | Step 1 | Click "Add Task". | "Create Task" input/modal appears. |
| | | | | | Step 2 | Enter task title, set optional details, and save. | The new task is rendered in the task list. |
| TC015_Sys_Pos_ListTasks | Positive | System | Retrieve task list. | Tasks exist. | Step 1 | Navigate to the Dashboard or a Project view. | All relevant tasks are displayed with current status, tags, and due dates. |
| TC016_Sys_Pos_GetTask | Positive | System | View a single task details. | Task exists. | Step 1 | Click on a task in the task list. | The Task Detail Drawer opens, showing full description, subtasks, and metadata. |
| TC017_Sys_Pos_UpdateTask | Positive | System | Modify a task. | Task exists. | Step 1 | In the task list or Drawer, modify a field or mark as complete. | The UI updates immediately to reflect the change. |
| TC018_Sys_Pos_DeleteTask | Positive | System | Delete a task. | Task exists. | Step 1 | Click the delete button for a task. | A confirmation prompt appears. |
| | | | | | Step 2 | Confirm deletion. | The task is completely removed from the task list. |
| TC019_Sys_Pos_CreateSubtask | Positive | System | Add subtask to a task. | Task exists. | Step 1 | Open a task's detail Drawer and click "Add Subtask". | Subtask input appears. |
| | | | | | Step 2 | Enter title and save. | The new subtask appears under the parent task. |
| TC020_Sys_Pos_UpdateSubtask | Positive | System | Edit subtask. | Subtask exists. | Step 1 | In a task's Drawer, edit a subtask's title or mark complete. | The subtask updates, and the parent task's progress indicator updates accordingly. |
| TC021_Sys_Pos_DeleteSubtask | Positive | System | Delete a subtask. | Subtask exists. | Step 1 | Hover over a subtask and click delete. | The subtask is removed from the list. |
| TC022_Sys_Pos_ReorderSubtasks | Positive | System | Drag and drop subtasks. | Task has subtasks. | Step 1 | Drag and drop subtasks into a new order. | The new order is preserved visually. |
| TC023_Sys_Pos_CreateTag | Positive | System | Create a new tag. | User logged in. | Step 1 | Navigate to Tags or select "Create new tag" on a task. | Tag creation input appears. |
| | | | | | Step 2 | Enter tag name/color and save. | The new tag is available for selection. |
| TC024_Sys_Pos_UpdateTag | Positive | System | Edit tag name or color. | Tag exists. | Step 1 | Navigate to the Tag manager and edit a tag. | Tag updates, and all tasks using this tag reflect the new details. |
| TC025_Sys_Pos_DeleteTag | Positive | System | Delete a tag. | Tag exists. | Step 1 | Click delete on a tag in the Tag manager. | Confirmation modal appears. |
| | | | | | Step 2 | Confirm deletion. | The tag is removed from all associated tasks. |
| TC026_Sys_Pos_AssignTagToTask | Positive | System | Assign a tag. | Task and Tag exist. | Step 1 | Open a task's details and select an existing tag. | The tag pill appears on the task in the Drawer and list view. |
| TC027_Sys_Pos_RemoveTagFromTask | Positive | System | Unassign a tag. | Task has tag. | Step 1 | Click the "x" on a tag pill on a task. | The tag pill disappears from the task. |
| TC028_Sys_Pos_GetNotifications | Positive | System | View notifications. | Notifications exist. | Step 1 | Click the notification bell icon. | The notifications panel opens listing recent alerts. |
| TC029_Sys_Pos_MarkNotificationRead | Positive | System | Mark notification as read. | Unread notification. | Step 1 | Click an unread notification or "Mark as read". | The visual unread indicator disappears, and the unread count decreases. |
| TC030_Sys_Pos_GetStats | Positive | System | View dashboard statistics. | Tasks exist. | Step 1 | Navigate to the Dashboard or Stats view. | Charts correctly display counts of completed/pending tasks. |
| TC031_Sys_Pos_GetAuditLogs | Positive | System | View activity history. | Actions performed. | Step 1 | Navigate to the Activity Log view. | A chronological list of the user's recent actions is displayed. |
| TC032_Sys_Neg_CreateTaskEmptyTitle | Negative | System | Prevent creating a task with no title. | User logged in. | Step 1 | Click "Add Task". | "Create Task" input/modal appears. |
| | | | | | Step 2 | Leave title empty and submit. | Validation error "Title is required" appears, task is not created. |
| TC033_Sys_Pos_FilterTasksByProject | Positive | System | Filter tasks by a specific project. | Project with tasks exists. | Step 1 | Click a project in the Sidebar. | Task list updates to show only tasks belonging to the selected project. |
| TC034_Sys_Pos_SearchTasks | Positive | System | Search tasks by keyword. | Tasks exist. | Step 1 | Type a keyword into the search bar. | Task list filters to show only matching tasks in real-time. |
| TC035_Sys_Neg_SearchTasksNoResults | Negative | System | Search returns no matching tasks. | Tasks exist. | Step 1 | Type a non-existent keyword into the search bar. | "No tasks found" empty state is displayed. |
| TC036_Sys_Neg_CreateProjectEmptyName | Negative | System | Prevent project creation with blank name. | User logged in. | Step 1 | Click "Add Project" in Sidebar. | Project creation input appears. |
| | | | | | Step 2 | Leave project name blank and submit. | Validation error appears, project is not saved. |
| TC037_Sys_Pos_ToggleTheme | Positive | System | Toggle between light and dark mode. | User logged in. | Step 1 | Click the theme toggle button. | Application theme updates immediately across all UI components. |
| TC038_Sys_Neg_CreateSubtaskEmptyTitle | Negative | System | Prevent subtask creation without a title. | Task exists. | Step 1 | Open task details and click "Add Subtask". | Subtask input appears. |
| | | | | | Step 2 | Leave title blank and submit. | Validation error appears, subtask is not added. |
| TC039_Sys_Pos_ViewTaskActivity | Positive | System | View activity history for a specific task. | Task has updates. | Step 1 | Open task details Drawer. | Task details load. |
| | | | | | Step 2 | Navigate to the "Activity" or "History" tab within the task. | A chronological list of changes made to this specific task is shown. |
| TC040_Sys_Neg_AccessProtectedRoute | Negative | System | Prevent unauthorized access to dashboard. | User logged out. | Step 1 | Manually navigate to the `/dashboard` URL. | User is redirected to the Login page. |
| TC041_Sys_Neg_CreateTaskDateInPast | Negative | System | Prevent setting a task due date in the past. | User logged in. | Step 1 | Click "Add Task" and enter a title. | Task form is filled. |
| | | | | | Step 2 | Select a due date in the past and submit. | Validation error appears, task is not created. |
| TC042_Sys_Pos_UpdateTaskClearDueDate | Positive | System | Remove an existing due date from a task. | Task with due date exists. | Step 1 | Open task details. | Task details are displayed. |
| | | | | | Step 2 | Clear the due date field and save. | Due date is removed from the task in the UI. |
| TC043_Sys_Neg_UpdateProjectDuplicateName | Negative | System | Prevent renaming project to an existing name. | Multiple projects exist. | Step 1 | Edit a project's settings. | Edit Project modal appears. |
| | | | | | Step 2 | Enter the name of another existing project and save. | "Project name already exists" error is displayed. |
| TC044_Sys_Pos_FilterTasksByMultipleTags | Positive | System | Filter tasks using multiple tags. | Tasks with tags exist. | Step 1 | Select two or more tags from the filter menu. | Task list updates to show tasks containing all/any of the selected tags. |
| TC045_Sys_Neg_UpdateTagEmptyName | Negative | System | Prevent updating a tag to have a blank name. | Tag exists. | Step 1 | Edit an existing tag in Tag manager. | Edit Tag input appears. |
| | | | | | Step 2 | Clear the tag name and save. | Validation error appears, tag is not updated. |
| TC046_Sys_Pos_CancelTaskCreation | Positive | System | Cancel the task creation process. | User logged in. | Step 1 | Click "Add Task" and type some text. | Task input/modal is visible. |
| | | | | | Step 2 | Click "Cancel" or press Escape. | Form closes, input is cleared, no new task is created. |
| TC047_Sys_Neg_LoginInvalidEmailFormat | Negative | System | Prevent login with malformed email format. | None. | Step 1 | Navigate to Login page. | Login form is displayed. |
| | | | | | Step 2 | Enter an invalid email (e.g., `test@.com`) and submit. | Form validation error (e.g., "Invalid email format") is displayed. |
| TC048_Sys_Neg_NavigateToNonExistentPage | Negative | System | Handle 404 for unknown URLs. | None. | Step 1 | Manually type an invalid URL path (e.g., `/unknown`). | 404 Not Found page is displayed. |
| TC049_Sys_Pos_ToggleTaskPriority | Positive | System | Update a task's priority level. | Task exists. | Step 1 | In the task list or Drawer, click the priority indicator. | Priority dropdown/toggle appears. |
| | | | | | Step 2 | Select a new priority level (e.g., High). | UI updates to show the new priority icon/color immediately. |
| TC050_Sys_Neg_AddVeryLongTaskTitle | Negative | System | Prevent creating a task with a title exceeding limits. | User logged in. | Step 1 | Click "Add Task". | Task creation input appears. |
| | | | | | Step 2 | Paste a string longer than 255 characters and submit. | Validation error regarding character limit is displayed. |
| TC051_Sys_Neg_LoginWithoutPassword | Negative | System | Prevent login when password is omitted. | None. | Step 1 | Enter email but leave password blank. | Login form is filled partially. |
| | | | | | Step 2 | Click Sign In. | Validation error "Password is required" is displayed. |
| TC052_Sys_Neg_RegisterWeakPassword | Negative | System | Prevent registration with a weak password. | None. | Step 1 | Enter valid name and email on Register page. | Form is filled partially. |
| | | | | | Step 2 | Enter a password under the minimum length (e.g., 3 chars) and submit. | Validation error regarding password strength/length is displayed. |
| TC053_Sys_Neg_RegisterPasswordMismatch | Negative | System | Prevent registration if password confirmation fails. | None. | Step 1 | Enter passwords that do not match in the password and confirm fields. | Passwords differ. |
| | | | | | Step 2 | Submit the registration form. | Validation error "Passwords do not match" is displayed. |
| TC054_Sys_Neg_UpdatePasswordWrongCurrent | Negative | System | Prevent password change if current password is wrong. | User logged in. | Step 1 | Navigate to Profile and attempt to change password. | Password form appears. |
| | | | | | Step 2 | Enter an incorrect current password and submit. | "Incorrect current password" error is displayed. |
| TC055_Sys_Neg_CreateTaskWhitespaceTitle | Negative | System | Prevent creating a task with only whitespace. | User logged in. | Step 1 | Click "Add Task" and type only spaces in the title. | Title appears blank visually. |
| | | | | | Step 2 | Submit the task. | Validation error "Title cannot be empty" is displayed. |
| TC056_Sys_Pos_CreateTaskWithLongDescription | Positive | System | Allow creating a task with a very long description. | User logged in. | Step 1 | Click "Add Task" and fill title. | Form is filled. |
| | | | | | Step 2 | Paste a large amount of text into the description and submit. | Task is created successfully and description renders correctly in details view. |
| TC057_Sys_Pos_CloseModalOnBackdropClick | Positive | System | Close modals by clicking the backdrop. | Modal is open. | Step 1 | Click outside the active modal window (on the backdrop). | The modal closes without saving any unsaved changes. |
| TC058_Sys_Pos_PressEscapeToCloseModal | Positive | System | Close modals by pressing the Escape key. | Modal is open. | Step 1 | Press the "Escape" key on the keyboard. | The modal closes automatically. |
| TC059_Sys_Pos_FilterCompletedTasks | Positive | System | Filter task list to show only completed tasks. | Tasks exist (some completed). | Step 1 | Select "Completed" from the status filter dropdown. | Task list updates to show only completed tasks. |
| TC060_Sys_Pos_FilterPendingTasks | Positive | System | Filter task list to show only pending tasks. | Tasks exist (some pending). | Step 1 | Select "Pending" or "To Do" from the status filter dropdown. | Task list updates to hide completed tasks. |
| TC061_Sys_Pos_ClearAllFilters | Positive | System | Clear all active filters to show all tasks. | Filters are active. | Step 1 | Click the "Clear Filters" button. | All filters are reset and the full task list is displayed. |
| TC062_Sys_Pos_SortTasksAlphabetically | Positive | System | Sort tasks from A to Z. | Tasks exist. | Step 1 | Select "Title (A-Z)" from the sort dropdown. | Tasks are visually reordered alphabetically by title. |
| TC063_Sys_Pos_SortTasksByCreationDate | Positive | System | Sort tasks by newest first. | Tasks exist. | Step 1 | Select "Newest First" from the sort dropdown. | Tasks are visually reordered by their creation date. |
| TC064_Sys_Neg_CreateTagDuplicateName | Negative | System | Prevent creating a tag with a duplicate name. | Tag "Urgent" exists. | Step 1 | Click "Create new tag" and enter "Urgent". | Form is filled. |
| | | | | | Step 2 | Submit the tag. | "Tag name already exists" error is displayed. |
| TC065_Sys_Pos_DeleteTaskWithTags | Positive | System | Deleting a task does not delete global tags. | Task has tags. | Step 1 | Delete a task that has a specific tag assigned. | Task is removed. |
| | | | | | Step 2 | Check the global Tag manager. | The tag still exists globally. |
| TC066_Sys_Pos_DeleteProjectWithTasks | Positive | System | Deleting a project warns about cascading deletion. | Project has tasks. | Step 1 | Click delete on a project containing tasks. | Warning modal explains that all nested tasks will also be deleted. |
| | | | | | Step 2 | Confirm deletion. | Project and its tasks are removed from the UI. |
| TC067_Sys_Pos_ToggleSidebarCollapse | Positive | System | Collapse and expand the navigation sidebar. | User logged in. | Step 1 | Click the sidebar toggle icon. | Sidebar collapses to show only icons. |
| | | | | | Step 2 | Click the toggle icon again. | Sidebar expands to show full labels. |
| TC068_Sys_Pos_UncheckSubtask | Positive | System | Uncheck a completed subtask. | Subtask is completed. | Step 1 | Click the checkbox of a completed subtask. | The subtask is marked as pending, and parent progress bar decreases. |
| TC069_Sys_Pos_CompleteAllSubtasks | Positive | System | Complete all subtasks of a task. | Task has multiple pending subtasks. | Step 1 | Check off every subtask. | The parent task's progress indicator reaches 100%. |
| TC070_Sys_Neg_UpdateSubtaskWhitespaceTitle | Negative | System | Prevent updating a subtask with blank title. | Subtask exists. | Step 1 | Edit a subtask and replace title with spaces. | Form is filled. |
| | | | | | Step 2 | Save the subtask. | Validation error is displayed. |
| TC071_Sys_Pos_DismissNotification | Positive | System | Dismiss a notification from the panel. | Notifications exist. | Step 1 | Click the "X" or dismiss button on a specific notification. | The notification is removed from the list. |
| TC072_Sys_Pos_NavigateTabsInDashboard | Positive | System | Switch between tabs on the dashboard. | User logged in. | Step 1 | Click on different tabs (e.g., Overview, Activity) in the Dashboard. | The content pane switches smoothly between the selected views. |
| TC073_Sys_Neg_NavigateBackAfterLogout | Negative | System | Prevent accessing app by using browser back button after logout. | User just logged out. | Step 1 | Press the browser's "Back" button. | User remains on Login page or is immediately redirected back to it. |
| TC074_Sys_Pos_SessionTimeout | Positive | System | Handle expired authentication sessions gracefully. | Session token expired. | Step 1 | Attempt to perform any API-dependent action (e.g., Add Task). | User is automatically redirected to the Login page with a "Session expired" message. |
| TC075_Sys_Pos_ResponsiveMobileMenu | Positive | System | Access navigation via hamburger menu on mobile. | Mobile viewport size. | Step 1 | Click the hamburger menu icon. | The mobile navigation menu slides in and is fully interactive. |
