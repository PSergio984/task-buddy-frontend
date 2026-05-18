const fs = require('fs');

const testCases = [
  // Authentication
  { id: 'TC001', name: 'RegisterNewUser', type: 'Sys', posNeg: 'Positive', 
    desc: 'Register a new user account with valid credentials.', 
    pre: 'User is on registration page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter valid email, username, and password.', exp: 'Fields are populated.' },
      { no: 'Step 2', desc: 'Click "Sign Up".', exp: 'User created, redirected to dashboard.' }
    ]
  },
  { id: 'TC002', name: 'RegisterDuplicateEmail', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to register with an existing email.', 
    pre: 'Email already exists in database.', 
    steps: [
      { no: 'Step 1', desc: 'Enter duplicate email and valid password.', exp: 'Fields populated.' },
      { no: 'Step 2', desc: 'Click "Sign Up".', exp: 'Error: "Email already registered".' }
    ]
  },
  { id: 'TC003', name: 'RegisterWeakPassword', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to register with a weak password.', 
    pre: 'User is on registration page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter valid email and password under 8 chars.', exp: 'Fields populated.' },
      { no: 'Step 2', desc: 'Click "Sign Up".', exp: 'Error: "Password must be at least 8 characters".' }
    ]
  },
  { id: 'TC004', name: 'RegisterInvalidEmailFormat', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to register with invalid email format.', 
    pre: 'User is on registration page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter invalid email (e.g., "test@").', exp: 'Validation error appears.' },
      { no: 'Step 2', desc: 'Click "Sign Up".', exp: 'Submission blocked by frontend validation.' }
    ]
  },
  { id: 'TC005', name: 'UserLogin', type: 'Sys', posNeg: 'Positive', 
    desc: 'Login with correct registered credentials.', 
    pre: 'User account exists.', 
    steps: [
      { no: 'Step 1', desc: 'Navigate to /login and enter credentials.', exp: 'Fields populated.' },
      { no: 'Step 2', desc: 'Click "Sign In".', exp: 'Redirected to dashboard, cookie set.' }
    ]
  },
  { id: 'TC006', name: 'LoginInvalidCredentials', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to login with wrong password.', 
    pre: 'User account exists.', 
    steps: [
      { no: 'Step 1', desc: 'Enter valid email and wrong password.', exp: 'Fields populated.' },
      { no: 'Step 2', desc: 'Click "Sign In".', exp: 'Error: "Invalid credentials".' }
    ]
  },
  { id: 'TC007', name: 'LoginNonexistentUser', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to login with unregistered email.', 
    pre: 'User is on login page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter unregistered email and password.', exp: 'Fields populated.' },
      { no: 'Step 2', desc: 'Click "Sign In".', exp: 'Error: "User not found" or "Invalid credentials".' }
    ]
  },
  { id: 'TC008', name: 'UserLogout', type: 'Sys', posNeg: 'Positive', 
    desc: 'Logout from active session.', 
    pre: 'User is logged in.', 
    steps: [
      { no: 'Step 1', desc: 'Click User Profile menu.', exp: 'Dropdown opens.' },
      { no: 'Step 2', desc: 'Click "Log Out".', exp: 'Cookie cleared, redirected to login.' }
    ]
  },
  { id: 'TC009', name: 'ForgotPasswordValid', type: 'Sys', posNeg: 'Positive', 
    desc: 'Request password reset with valid email.', 
    pre: 'User is on Forgot Password page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter valid registered email.', exp: 'Field populated.' },
      { no: 'Step 2', desc: 'Click "Send Reset Link".', exp: 'Success message shown.' }
    ]
  },
  { id: 'TC010', name: 'ForgotPasswordInvalid', type: 'Sys', posNeg: 'Negative', 
    desc: 'Request password reset with invalid email.', 
    pre: 'User is on Forgot Password page.', 
    steps: [
      { no: 'Step 1', desc: 'Enter unregistered email.', exp: 'Field populated.' },
      { no: 'Step 2', desc: 'Click "Send Reset Link".', exp: 'Generic success message shown (anti-enumeration).' }
    ]
  },
  { id: 'TC011', name: 'AccessProtectedWithoutLogin', type: 'Sys', posNeg: 'Negative', 
    desc: 'Attempt to access dashboard without session.', 
    pre: 'User is logged out.', 
    steps: [
      { no: 'Step 1', desc: 'Navigate directly to /tasks.', exp: 'Redirected to /login.' }
    ]
  },
  { id: 'TC012', name: 'ExpiredSessionToken', type: 'Sys', posNeg: 'Negative', 
    desc: 'Perform action with expired token.', 
    pre: 'User has expired HttpOnly cookie.', 
    steps: [
      { no: 'Step 1', desc: 'Attempt to create a task.', exp: 'Request fails with 401.' },
      { no: 'Step 2', desc: 'Observe UI.', exp: 'Redirected to login with "Session expired" message.' }
    ]
  },

  // Task Management
  { id: 'TC013', name: 'CreateTaskMinFields', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create task using only title.', 
    pre: 'User is on dashboard.', 
    steps: [
      { no: 'Step 1', desc: 'Open Add Task modal and enter Title.', exp: 'Title entered.' },
      { no: 'Step 2', desc: 'Click "Create".', exp: 'Task created in Inbox.' }
    ]
  },
  { id: 'TC014', name: 'CreateTaskAllFields', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create task with title, project, tags, due date, priority.', 
    pre: 'Projects and tags exist.', 
    steps: [
      { no: 'Step 1', desc: 'Fill all fields in Add Task modal.', exp: 'All fields populated.' },
      { no: 'Step 2', desc: 'Click "Create".', exp: 'Task created with correct metadata.' }
    ]
  },
  { id: 'TC015', name: 'CreateTaskEmptyTitle', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to create task without title.', 
    pre: 'Add Task modal is open.', 
    steps: [
      { no: 'Step 1', desc: 'Leave title blank and click "Create".', exp: 'Error: "Title is required".' }
    ]
  },
  { id: 'TC016', name: 'CreateTaskExceedTitleLength', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to create task with > 255 chars title.', 
    pre: 'Add Task modal is open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter 256 char string in title.', exp: 'Input blocked or validation error shown.' },
      { no: 'Step 2', desc: 'Click "Create".', exp: 'Submission blocked.' }
    ]
  },
  { id: 'TC017', name: 'UpdateTaskTitle', type: 'Sys', posNeg: 'Positive', 
    desc: 'Edit existing task title.', 
    pre: 'Task exists.', 
    steps: [
      { no: 'Step 1', desc: 'Open Task Drawer and edit title.', exp: 'Title changed.' },
      { no: 'Step 2', desc: 'Save or blur field.', exp: 'Title updated in UI and synced to server.' }
    ]
  },
  { id: 'TC018', name: 'ToggleTaskCompletion', type: 'Sys', posNeg: 'Positive', 
    desc: 'Mark task as complete/incomplete.', 
    pre: 'Incomplete task exists.', 
    steps: [
      { no: 'Step 1', desc: 'Click checkbox on task card.', exp: 'Task strikes through and moves to Completed section.' }
    ]
  },
  { id: 'TC019', name: 'DeleteTask', type: 'Sys', posNeg: 'Positive', 
    desc: 'Delete a task from the list.', 
    pre: 'Task exists.', 
    steps: [
      { no: 'Step 1', desc: 'Click delete icon in Task Drawer.', exp: 'Confirmation modal opens.' },
      { no: 'Step 2', desc: 'Confirm delete.', exp: 'Task removed from UI.' }
    ]
  },
  { id: 'TC020', name: 'CreateTaskOffline', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create task while disconnected from internet.', 
    pre: 'App loaded, network disconnected.', 
    steps: [
      { no: 'Step 1', desc: 'Create task.', exp: 'Task appears in UI (Optimistic).' },
      { no: 'Step 2', desc: 'Reconnect to internet.', exp: 'Task syncs to server.' }
    ]
  },
  { id: 'TC021', name: 'TaskLimitReached', type: 'API', posNeg: 'Negative', 
    desc: 'Fail to exceed 1000 tasks per user.', 
    pre: 'User has 1000 tasks.', 
    steps: [
      { no: 'Step 1', desc: 'Attempt to create task 1001 via API.', exp: 'Error 400: "Cannot exceed 1000 tasks".' }
    ]
  },
  { id: 'TC022', name: 'UpdateNonexistentTask', type: 'API', posNeg: 'Negative', 
    desc: 'Fail to update invalid task ID.', 
    pre: 'Authenticated user.', 
    steps: [
      { no: 'Step 1', desc: 'Send PUT request to invalid task ID.', exp: 'Error 404: "Task not found".' }
    ]
  },
  { id: 'TC023', name: 'MoveTaskToProject', type: 'Sys', posNeg: 'Positive', 
    desc: 'Change project assignment of a task.', 
    pre: 'Task and two projects exist.', 
    steps: [
      { no: 'Step 1', desc: 'Change project in Task Drawer.', exp: 'Task moves to new project view.' }
    ]
  },
  { id: 'TC024', name: 'AssignMultipleTags', type: 'Sys', posNeg: 'Positive', 
    desc: 'Add multiple tags to task.', 
    pre: 'Task and tags exist.', 
    steps: [
      { no: 'Step 1', desc: 'Select 3 tags in Task Drawer.', exp: 'Tags display on task card.' }
    ]
  },
  { id: 'TC025', name: 'AssignExcessiveTags', type: 'API', posNeg: 'Negative', 
    desc: 'Fail to assign more than 10 tags.', 
    pre: 'Task exists.', 
    steps: [
      { no: 'Step 1', desc: 'Attempt to assign 11 tags via API.', exp: 'Error 400: "Maximum tags per task reached".' }
    ]
  },
  { id: 'TC026', name: 'CreateTaskPastDue', type: 'Sys', posNeg: 'Negative', 
    desc: 'Prevent past due dates on creation.', 
    pre: 'Add Task modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Select yesterday as due date.', exp: 'Error tooltip "Cannot be in the past".' }
    ]
  },
  { id: 'TC027', name: 'CreateTaskNoSubtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Task creation without subtasks works.', 
    pre: 'Add task modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Create task with no subtasks added.', exp: 'Task created. Drawer shows 0 subtasks.' }
    ]
  },
  { id: 'TC028', name: 'CreateTaskMarkdownDescription', type: 'Sys', posNeg: 'Positive', 
    desc: 'Description supports markdown rendering.', 
    pre: 'Task modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter "**Bold**" in description.', exp: 'Renders bold in Drawer.' }
    ]
  },
  { id: 'TC029', name: 'CreateTaskLongDescription', type: 'Sys', posNeg: 'Positive', 
    desc: 'Description handles up to 2000 chars.', 
    pre: 'Task modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter 2000 chars in description.', exp: 'Task created successfully without truncation.' }
    ]
  },
  { id: 'TC030', name: 'CreateTaskExceedDescription', type: 'Sys', posNeg: 'Negative', 
    desc: 'Description over 2000 chars rejected.', 
    pre: 'Task modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Paste 2001 chars in description.', exp: 'Input truncated or validation error appears.' }
    ]
  },

  // Subtasks
  { id: 'TC031', name: 'AddSubtask', type: 'Sys', posNeg: 'Positive', 
    desc: 'Add a subtask to an existing task.', 
    pre: 'Task Drawer open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter text in Add Subtask input and press Enter.', exp: 'Subtask added to list.' }
    ]
  },
  { id: 'TC032', name: 'ToggleSubtaskProgress', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toggle subtask updates main task progress.', 
    pre: 'Task has 2 subtasks (0% complete).', 
    steps: [
      { no: 'Step 1', desc: 'Check one subtask.', exp: 'Main task progress bar updates to 50%.' }
    ]
  },
  { id: 'TC033', name: 'DeleteSubtask', type: 'Sys', posNeg: 'Positive', 
    desc: 'Delete a subtask from a task.', 
    pre: 'Task has subtasks.', 
    steps: [
      { no: 'Step 1', desc: 'Click delete icon on subtask.', exp: 'Subtask removed, progress recalculates.' }
    ]
  },
  { id: 'TC034', name: 'AddEmptySubtask', type: 'Sys', posNeg: 'Negative', 
    desc: 'Prevent empty subtask creation.', 
    pre: 'Task Drawer open.', 
    steps: [
      { no: 'Step 1', desc: 'Press Enter in empty Add Subtask input.', exp: 'Nothing happens.' }
    ]
  },
  { id: 'TC035', name: 'MaxSubtasksReached', type: 'API', posNeg: 'Negative', 
    desc: 'Prevent exceeding 50 subtasks.', 
    pre: 'Task has 50 subtasks.', 
    steps: [
      { no: 'Step 1', desc: 'Attempt to add 51st subtask.', exp: 'Error: "Cannot exceed 50 subtasks".' }
    ]
  },
  { id: 'TC036', name: 'EditSubtaskTitle', type: 'Sys', posNeg: 'Positive', 
    desc: 'Modify existing subtask title.', 
    pre: 'Task Drawer open.', 
    steps: [
      { no: 'Step 1', desc: 'Click subtask title and edit.', exp: 'Title updates successfully.' }
    ]
  },
  { id: 'TC037', name: 'ReorderSubtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Drag and drop subtasks.', 
    pre: 'Task has multiple subtasks.', 
    steps: [
      { no: 'Step 1', desc: 'Drag subtask 2 above subtask 1.', exp: 'Order updates and persists.' }
    ]
  },
  { id: 'TC038', name: 'CompleteAllSubtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Completing all subtasks completes main task optionally.', 
    pre: 'Task has 1 subtask.', 
    steps: [
      { no: 'Step 1', desc: 'Check subtask.', exp: 'Progress is 100%.' }
    ]
  },
  { id: 'TC039', name: 'AddSubtaskOffline', type: 'Sys', posNeg: 'Positive', 
    desc: 'Add subtask while offline.', 
    pre: 'Network disconnected.', 
    steps: [
      { no: 'Step 1', desc: 'Add subtask.', exp: 'Added to UI locally, queued for sync.' }
    ]
  },
  { id: 'TC040', name: 'AddSubtaskLongTitle', type: 'Sys', posNeg: 'Positive', 
    desc: 'Add subtask with 80 chars.', 
    pre: 'Drawer open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter 80 chars.', exp: 'Subtask added successfully.' }
    ]
  },

  // Projects
  { id: 'TC041', name: 'CreateProject', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create a new project.', 
    pre: 'Dashboard loaded.', 
    steps: [
      { no: 'Step 1', desc: 'Click + by Projects in sidebar, enter name.', exp: 'Project created and appears in sidebar.' }
    ]
  },
  { id: 'TC042', name: 'CreateDuplicateProject', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to create project with duplicate name.', 
    pre: 'Project "Work" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Create new project named "Work".', exp: 'Error: "Project with this name already exists".' }
    ]
  },
  { id: 'TC043', name: 'RenameProject', type: 'Sys', posNeg: 'Positive', 
    desc: 'Edit project name.', 
    pre: 'Project exists.', 
    steps: [
      { no: 'Step 1', desc: 'Select Edit on project, change name.', exp: 'Name updates in sidebar and headers.' }
    ]
  },
  { id: 'TC044', name: 'DeleteProjectCascade', type: 'Sys', posNeg: 'Positive', 
    desc: 'Delete project and cascade delete tasks.', 
    pre: 'Project has 2 tasks.', 
    steps: [
      { no: 'Step 1', desc: 'Delete project, confirm cascade.', exp: 'Project and 2 tasks removed.' }
    ]
  },
  { id: 'TC045', name: 'DeleteProjectKeepTasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Delete project but keep tasks.', 
    pre: 'Project has tasks.', 
    steps: [
      { no: 'Step 1', desc: 'Delete project, opt to keep tasks.', exp: 'Tasks moved to Inbox.' }
    ]
  },
  { id: 'TC046', name: 'ReorderProjects', type: 'Sys', posNeg: 'Positive', 
    desc: 'Drag and drop projects in sidebar.', 
    pre: 'Multiple projects exist.', 
    steps: [
      { no: 'Step 1', desc: 'Drag project A below project B.', exp: 'Order is persisted.' }
    ]
  },
  { id: 'TC047', name: 'DeleteActiveProject', type: 'Sys', posNeg: 'Edge', 
    desc: 'Delete project currently being viewed.', 
    pre: 'Viewing Project A.', 
    steps: [
      { no: 'Step 1', desc: 'Delete Project A.', exp: 'Redirected to "All Tasks" view.' }
    ]
  },
  { id: 'TC048', name: 'CreateProjectEmptyName', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to create project without name.', 
    pre: 'Create project modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Click Save with empty name.', exp: 'Button disabled or validation error.' }
    ]
  },
  { id: 'TC049', name: 'ProjectColorChange', type: 'Sys', posNeg: 'Positive', 
    desc: 'Change project color icon.', 
    pre: 'Project exists.', 
    steps: [
      { no: 'Step 1', desc: 'Edit project, change color to red.', exp: 'Sidebar icon turns red.' }
    ]
  },
  { id: 'TC050', name: 'ProjectTaskCount', type: 'Sys', posNeg: 'Positive', 
    desc: 'Project shows accurate task count.', 
    pre: 'Project has 3 tasks.', 
    steps: [
      { no: 'Step 1', desc: 'View sidebar project item.', exp: 'Badge shows "3".' }
    ]
  },

  // Tags
  { id: 'TC051', name: 'CreateTag', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create new tag.', 
    pre: 'Sidebar loaded.', 
    steps: [
      { no: 'Step 1', desc: 'Click + by Tags, enter name "Urgent".', exp: 'Tag appears in sidebar.' }
    ]
  },
  { id: 'TC052', name: 'CreateDuplicateTag', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail to create duplicate tag.', 
    pre: 'Tag "Urgent" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Create tag "Urgent".', exp: 'Error: "Tag name already exists".' }
    ]
  },
  { id: 'TC053', name: 'DeleteTag', type: 'Sys', posNeg: 'Positive', 
    desc: 'Delete existing tag.', 
    pre: 'Tag exists on 1 task.', 
    steps: [
      { no: 'Step 1', desc: 'Delete tag.', exp: 'Tag removed from sidebar and task card.' }
    ]
  },
  { id: 'TC054', name: 'ReorderTags', type: 'Sys', posNeg: 'Positive', 
    desc: 'Drag and drop tags in sidebar.', 
    pre: 'Multiple tags exist.', 
    steps: [
      { no: 'Step 1', desc: 'Drag tags.', exp: 'Sidebar order persists.' }
    ]
  },
  { id: 'TC055', name: 'TagLimitReached', type: 'API', posNeg: 'Negative', 
    desc: 'Fail to exceed 50 tags limit.', 
    pre: 'User has 50 tags.', 
    steps: [
      { no: 'Step 1', desc: 'Attempt to create 51st tag.', exp: 'Error: "Cannot exceed 50 tags".' }
    ]
  },
  { id: 'TC056', name: 'FilterByTag', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clicking tag filters task list.', 
    pre: 'Tag exists on tasks.', 
    steps: [
      { no: 'Step 1', desc: 'Click tag in sidebar.', exp: 'Only tasks with tag are shown.' }
    ]
  },
  { id: 'TC057', name: 'FilterByMultipleTags', type: 'Sys', posNeg: 'Positive', 
    desc: 'Filter by combining tags.', 
    pre: 'Tasks with multiple tags exist.', 
    steps: [
      { no: 'Step 1', desc: 'Select Tag A and Tag B.', exp: 'Shows tasks matching ALL selected tags.' }
    ]
  },
  { id: 'TC058', name: 'EditTagColor', type: 'Sys', posNeg: 'Positive', 
    desc: 'Change tag color.', 
    pre: 'Tag exists.', 
    steps: [
      { no: 'Step 1', desc: 'Edit tag color.', exp: 'Color updates on sidebar and associated tasks.' }
    ]
  },
  { id: 'TC059', name: 'CreateTagEmptyName', type: 'Sys', posNeg: 'Negative', 
    desc: 'Prevent empty tag name.', 
    pre: 'Create tag modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Submit empty name.', exp: 'Validation error.' }
    ]
  },
  { id: 'TC060', name: 'CreateTagMaxChars', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create tag with exactly 20 chars.', 
    pre: 'Create tag modal open.', 
    steps: [
      { no: 'Step 1', desc: 'Enter 20 chars.', exp: 'Tag created.' }
    ]
  },

  // Sidebar & Navigation
  { id: 'TC061', name: 'CollapseSidebar', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sidebar minimizes to icon view.', 
    pre: 'Sidebar expanded.', 
    steps: [
      { no: 'Step 1', desc: 'Click collapse toggle.', exp: 'Sidebar width becomes 72px, tooltips enabled.' }
    ]
  },
  { id: 'TC062', name: 'ExpandSidebar', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sidebar maximizes to full view.', 
    pre: 'Sidebar collapsed.', 
    steps: [
      { no: 'Step 1', desc: 'Click expand toggle.', exp: 'Sidebar width becomes 280px, text visible.' }
    ]
  },
  { id: 'TC063', name: 'NavigateToday', type: 'Sys', posNeg: 'Positive', 
    desc: 'View Today smart list.', 
    pre: 'Tasks exist due today.', 
    steps: [
      { no: 'Step 1', desc: 'Click "Today" in sidebar.', exp: 'Shows tasks due today.' }
    ]
  },
  { id: 'TC064', name: 'NavigateUpcoming', type: 'Sys', posNeg: 'Positive', 
    desc: 'View Upcoming smart list.', 
    pre: 'Tasks exist due tomorrow.', 
    steps: [
      { no: 'Step 1', desc: 'Click "Upcoming".', exp: 'Shows future tasks.' }
    ]
  },
  { id: 'TC065', name: 'NavigateHighPriority', type: 'Sys', posNeg: 'Positive', 
    desc: 'View High Priority list.', 
    pre: 'High priority tasks exist.', 
    steps: [
      { no: 'Step 1', desc: 'Click "High Priority".', exp: 'Shows P1/Urgent tasks.' }
    ]
  },
  { id: 'TC066', name: 'PersistSidebarState', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sidebar state persists refresh.', 
    pre: 'Sidebar collapsed.', 
    steps: [
      { no: 'Step 1', desc: 'Refresh page.', exp: 'Sidebar loads collapsed.' }
    ]
  },
  { id: 'TC067', name: 'MobileDrawerOpen', type: 'Sys', posNeg: 'Positive', 
    desc: 'Mobile hamburger opens drawer.', 
    pre: 'Mobile viewport.', 
    steps: [
      { no: 'Step 1', desc: 'Click hamburger menu.', exp: 'Sidebar slides in from left.' }
    ]
  },
  { id: 'TC068', name: 'MobileDrawerClose', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clicking overlay closes mobile drawer.', 
    pre: 'Mobile drawer open.', 
    steps: [
      { no: 'Step 1', desc: 'Click background overlay.', exp: 'Drawer slides out.' }
    ]
  },
  { id: 'TC069', name: 'RoutePersistence', type: 'Sys', posNeg: 'Positive', 
    desc: 'Refreshing a specific project stays on project.', 
    pre: 'Viewing Project A (/projects/1).', 
    steps: [
      { no: 'Step 1', desc: 'Refresh page.', exp: 'Project A view loads immediately.' }
    ]
  },
  { id: 'TC070', name: 'NavigateNotFound', type: 'Sys', posNeg: 'Negative', 
    desc: 'Navigate to non-existent route.', 
    pre: 'Logged in.', 
    steps: [
      { no: 'Step 1', desc: 'Navigate to /invalid-path.', exp: 'Shows 404 / Not Found page.' }
    ]
  },

  // Filtering & Search
  { id: 'TC071', name: 'SearchTaskTitle', type: 'Sys', posNeg: 'Positive', 
    desc: 'Search matches task titles.', 
    pre: 'Task "Buy milk" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Type "milk" in search bar.', exp: 'List filters to show "Buy milk".' }
    ]
  },
  { id: 'TC072', name: 'SearchTaskDescription', type: 'Sys', posNeg: 'Positive', 
    desc: 'Search matches task descriptions.', 
    pre: 'Task with desc "Meeting at 5" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Type "Meeting" in search.', exp: 'Task appears in results.' }
    ]
  },
  { id: 'TC073', name: 'SearchSpecialChars', type: 'Sys', posNeg: 'Edge', 
    desc: 'Search handles special characters safely.', 
    pre: 'Task "Report #1" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Type "#1" in search.', exp: 'Task appears without crashing.' }
    ]
  },
  { id: 'TC074', name: 'ClearSearch', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clearing search restores list.', 
    pre: 'Search active.', 
    steps: [
      { no: 'Step 1', desc: 'Click clear (X) icon in search.', exp: 'Original task list restored.' }
    ]
  },
  { id: 'TC075', name: 'SearchCombineProjectFilter', type: 'Sys', posNeg: 'Positive', 
    desc: 'Search respects current project view.', 
    pre: 'Viewing Project A.', 
    steps: [
      { no: 'Step 1', desc: 'Search for "Task".', exp: 'Only shows "Task" from Project A.' }
    ]
  },
  { id: 'TC076', name: 'SearchNoMatches', type: 'Sys', posNeg: 'Positive', 
    desc: 'Search with zero results.', 
    pre: 'Search active.', 
    steps: [
      { no: 'Step 1', desc: 'Type "xyz123".', exp: 'Shows "No tasks found" empty state.' }
    ]
  },
  { id: 'TC077', name: 'SortByPriority', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sort list by priority.', 
    pre: 'Tasks with mixed priorities exist.', 
    steps: [
      { no: 'Step 1', desc: 'Select "Priority (High to Low)".', exp: 'P1 tasks at top, P4 at bottom.' }
    ]
  },
  { id: 'TC078', name: 'SortByDueDate', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sort list by due date.', 
    pre: 'Tasks with different due dates exist.', 
    steps: [
      { no: 'Step 1', desc: 'Select "Due Date (Earliest)".', exp: 'Overdue and today tasks at top.' }
    ]
  },
  { id: 'TC079', name: 'FilterCompleted', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toggle showing completed tasks.', 
    pre: 'Completed tasks exist.', 
    steps: [
      { no: 'Step 1', desc: 'Toggle "Show Completed".', exp: 'Completed tasks appear at bottom of list.' }
    ]
  },
  { id: 'TC080', name: 'SearchCaseInsensitive', type: 'Sys', posNeg: 'Positive', 
    desc: 'Search ignores case.', 
    pre: 'Task "APPle" exists.', 
    steps: [
      { no: 'Step 1', desc: 'Search "apple".', exp: 'Returns "APPle".' }
    ]
  },

  // Real-time Sync & Offline
  { id: 'TC081', name: 'OfflineTaskCreateSync', type: 'Sys', posNeg: 'Positive', 
    desc: 'Task created offline syncs when online.', 
    pre: 'Network disconnected.', 
    steps: [
      { no: 'Step 1', desc: 'Create task.', exp: 'Task shows Syncing indicator.' },
      { no: 'Step 2', desc: 'Reconnect network.', exp: 'Sync indicator disappears, saved to DB.' }
    ]
  },
  { id: 'TC082', name: 'OfflinePersistenceReload', type: 'Sys', posNeg: 'Positive', 
    desc: 'Offline task survives page reload.', 
    pre: 'Task created offline.', 
    steps: [
      { no: 'Step 1', desc: 'Refresh page (still offline).', exp: 'Task loaded from IndexedDB.' }
    ]
  },
  { id: 'TC083', name: 'SyncConflictLWW', type: 'Sys', posNeg: 'Edge', 
    desc: 'Last Write Wins resolution.', 
    pre: 'Device A offline, Device B online.', 
    steps: [
      { no: 'Step 1', desc: 'Edit task on B, then edit on A. A comes online.', exp: 'A overrides B (newer timestamp).' }
    ]
  },
  { id: 'TC084', name: 'WebSocketLiveUpdate', type: 'Sys', posNeg: 'Positive', 
    desc: 'Receive WebSocket updates instantly.', 
    pre: 'Two tabs open.', 
    steps: [
      { no: 'Step 1', desc: 'Delete task in Tab A.', exp: 'Task disappears from Tab B instantly.' }
    ]
  },
  { id: 'TC085', name: 'WebSocketDisconnectReconnect', type: 'Sys', posNeg: 'Edge', 
    desc: 'WebSocket reconnects automatically.', 
    pre: 'WebSocket connected.', 
    steps: [
      { no: 'Step 1', desc: 'Simulate WS drop.', exp: 'UI shows Offline. Reconnects via exponential backoff.' }
    ]
  },
  { id: 'TC086', name: 'RefetchOnReconnect', type: 'Sys', posNeg: 'Positive', 
    desc: 'Query cache invalidates and refetches when browser comes back online.', 
    pre: 'App was offline, now back online.', 
    steps: [
      { no: 'Step 1', desc: 'Observe network tab on reconnect.', exp: 'GET /api/v1/tasks/ triggered automatically.' }
    ]
  },
  { id: 'TC087', name: 'OfflineDeleteSync', type: 'Sys', posNeg: 'Positive', 
    desc: 'Task deleted offline syncs deletion.', 
    pre: 'Task exists. Offline.', 
    steps: [
      { no: 'Step 1', desc: 'Delete task. Go online.', exp: 'Deletion synced to server.' }
    ]
  },
  { id: 'TC088', name: 'OfflineProjectCreate', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create project offline.', 
    pre: 'Offline.', 
    steps: [
      { no: 'Step 1', desc: 'Create project.', exp: 'Project appears. Syncs when online.' }
    ]
  },
  { id: 'TC089', name: 'WebSocketPingPong', type: 'Sys', posNeg: 'Positive', 
    desc: 'Heartbeat keeps connection alive.', 
    pre: 'Tab idle for 2 minutes.', 
    steps: [
      { no: 'Step 1', desc: 'Check network tab.', exp: 'Ping/Pong frames exchanged every 30s.' }
    ]
  },
  { id: 'TC090', name: 'IndexedDBQuotaExceeded', type: 'Sys', posNeg: 'Negative', 
    desc: 'Handle full local storage gracefully.', 
    pre: 'IndexedDB artificially filled.', 
    steps: [
      { no: 'Step 1', desc: 'Create task.', exp: 'Error toast "Local storage full, data may not sync".' }
    ]
  },

  // Notifications
  { id: 'TC091', name: 'ReceiveDueNotification', type: 'Sys', posNeg: 'Positive', 
    desc: 'Bell icon shows badge for due tasks.', 
    pre: 'Task due in 15 mins.', 
    steps: [
      { no: 'Step 1', desc: 'Wait for cron check.', exp: 'Bell icon shows red badge (1).' }
    ]
  },
  { id: 'TC092', name: 'MarkNotificationRead', type: 'Sys', posNeg: 'Positive', 
    desc: 'Mark single notification as read.', 
    pre: 'Unread notification exists.', 
    steps: [
      { no: 'Step 1', desc: 'Click notification item.', exp: 'Style becomes unbolded, badge count drops.' }
    ]
  },
  { id: 'TC093', name: 'DeleteNotification', type: 'Sys', posNeg: 'Positive', 
    desc: 'Remove notification from list.', 
    pre: 'Notification exists.', 
    steps: [
      { no: 'Step 1', desc: 'Click (X) on notification.', exp: 'Item removed.' }
    ]
  },
  { id: 'TC094', name: 'MarkAllNotificationsRead', type: 'Sys', posNeg: 'Positive', 
    desc: 'Mark all read button.', 
    pre: '3 unread notifications.', 
    steps: [
      { no: 'Step 1', desc: 'Click "Mark all as read".', exp: 'Badge disappears, all items unbolded.' }
    ]
  },
  { id: 'TC095', name: 'NotificationOfflineBuffer', type: 'Sys', posNeg: 'Positive', 
    desc: 'Notifications received during offline are shown upon reconnect.', 
    pre: 'Offline. Task comes due.', 
    steps: [
      { no: 'Step 1', desc: 'Reconnect.', exp: 'Badge updates immediately.' }
    ]
  },
  { id: 'TC096', name: 'NotificationEmptyState', type: 'Sys', posNeg: 'Positive', 
    desc: 'Empty state when no notifications.', 
    pre: '0 notifications.', 
    steps: [
      { no: 'Step 1', desc: 'Click Bell icon.', exp: 'Dropdown shows "You have no notifications".' }
    ]
  },
  { id: 'TC097', name: 'NotificationBadgeMax', type: 'Sys', posNeg: 'Positive', 
    desc: 'Badge shows 99+ for many notifications.', 
    pre: '105 unread notifications.', 
    steps: [
      { no: 'Step 1', desc: 'Look at Bell icon.', exp: 'Badge text is "99+".' }
    ]
  },
  { id: 'TC098', name: 'NotificationClickRoute', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clicking notification opens related task.', 
    pre: 'Task notification exists.', 
    steps: [
      { no: 'Step 1', desc: 'Click notification body.', exp: 'Task Drawer opens for that task.' }
    ]
  },

  // Dashboard & Stats
  { id: 'TC099', name: 'DashboardTaskCount', type: 'Sys', posNeg: 'Positive', 
    desc: 'Dashboard shows correct total tasks.', 
    pre: 'Dashboard loaded.', 
    steps: [{ no: 'Step 1', desc: 'Check overview card.', exp: 'Number matches total active tasks.' }]
  },
  { id: 'TC100', name: 'DashboardProjectChart', type: 'Sys', posNeg: 'Positive', 
    desc: 'Chart renders project distribution.', 
    pre: 'Tasks in multiple projects.', 
    steps: [{ no: 'Step 1', desc: 'View chart.', exp: 'Slices match project distribution.' }]
  },
  { id: 'TC101', name: 'DashboardEmptyState', type: 'Sys', posNeg: 'Positive', 
    desc: 'Dashboard when 0 tasks exist.', 
    pre: 'New account.', 
    steps: [{ no: 'Step 1', desc: 'View dashboard.', exp: 'Shows "Create your first task" CTA.' }]
  },
  { id: 'TC102', name: 'ToggleDarkMode', type: 'Sys', posNeg: 'Positive', 
    desc: 'Switch to dark theme.', 
    pre: 'Light theme active.', 
    steps: [{ no: 'Step 1', desc: 'Click moon icon.', exp: 'Colors swap to dark palette.' }]
  },
  { id: 'TC103', name: 'KeyboardNavSidebar', type: 'Sys', posNeg: 'Positive', 
    desc: 'Navigate sidebar with Tab.', 
    pre: 'Focus on sidebar.', 
    steps: [{ no: 'Step 1', desc: 'Press Tab and Enter.', exp: 'Focus rings appear, Enter navigates to list.' }]
  },
  { id: 'TC104', name: 'KeyboardEscModal', type: 'Sys', posNeg: 'Positive', 
    desc: 'Esc key closes modals.', 
    pre: 'Add Task modal open.', 
    steps: [{ no: 'Step 1', desc: 'Press Esc.', exp: 'Modal closes.' }]
  },
  { id: 'TC105', name: 'PWAInstallPrompt', type: 'Sys', posNeg: 'Positive', 
    desc: 'PWA Install button visible.', 
    pre: 'Chrome browser, app not installed.', 
    steps: [{ no: 'Step 1', desc: 'Check header.', exp: '"Install App" button is visible.' }]
  },
  { id: 'TC106', name: 'SkeletonLoaders', type: 'Sys', posNeg: 'Positive', 
    desc: 'Skeletons show on initial load.', 
    pre: 'Slow network.', 
    steps: [{ no: 'Step 1', desc: 'Reload page.', exp: 'Grey animated skeletons render before data.' }]
  },
  { id: 'TC107', name: 'IdorTaskAccess', type: 'API', posNeg: 'Negative', 
    desc: 'Prevent accessing another users task.', 
    pre: 'Task belongs to User B. Logged as A.', 
    steps: [{ no: 'Step 1', desc: 'GET /api/tasks/{UserB_Task_ID}.', exp: 'Error 404 or 403.' }]
  },
  { id: 'TC108', name: 'MalformedJsonCache', type: 'Sys', posNeg: 'Edge', 
    desc: 'Recover from corrupted IndexedDB.', 
    pre: 'IndexedDB data corrupted.', 
    steps: [{ no: 'Step 1', desc: 'Reload app.', exp: 'App clears cache and fetches fresh from server.' }]
  },
  { id: 'TC109', name: 'Performance1000Tasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'App remains responsive with max tasks.', 
    pre: 'User has 1000 tasks.', 
    steps: [{ no: 'Step 1', desc: 'Scroll and filter tasks.', exp: 'UI does not freeze; 60fps maintained via virtualization.' }]
  },
  { id: 'TC110', name: 'ConcurrentEditsLWW', type: 'Sys', posNeg: 'Edge', 
    desc: 'Two rapid edits on same task.', 
    pre: 'Rapid sequence of PUTs.', 
    steps: [{ no: 'Step 1', desc: 'Send PUT A then PUT B instantly.', exp: 'Backend ensures B (latest timestamp) is final state.' }]
  },

  // --- 100+ NEW TEST SCENARIOS ---
  // API Validation & Error Handling (TC111 - TC130)
  { id: 'TC111', name: 'CreateTaskInvalidProjectId', type: 'API', posNeg: 'Negative', 
    desc: 'Validate error when project_id is invalid type.', 
    pre: 'Auth token active.', 
    steps: [{ no: 'Step 1', desc: 'POST /tasks with project_id: "abc".', exp: 'Error 422 Unprocessable Entity.' }]
  },
  { id: 'TC112', name: 'CreateTaskMissingTitle', type: 'API', posNeg: 'Negative', 
    desc: 'Validate API level mandatory field check.', 
    pre: 'Auth token active.', 
    steps: [{ no: 'Step 1', desc: 'POST /tasks without title field.', exp: 'Error 422: field required.' }]
  },
  { id: 'TC113', name: 'UpdateTaskInvalidPriority', type: 'API', posNeg: 'Negative', 
    desc: 'Validate priority enum constraints.', 
    pre: 'Task exists.', 
    steps: [{ no: 'Step 1', desc: 'PUT /tasks/{id} with priority: "URGENT_NOW".', exp: 'Error 422: not a valid enum value.' }]
  },
  { id: 'TC114', name: 'DeleteProjectNonexistent', type: 'API', posNeg: 'Negative', 
    desc: 'Validate deletion of non-existent project.', 
    pre: 'Auth token active.', 
    steps: [{ no: 'Step 1', desc: 'DELETE /projects/999999.', exp: 'Error 404 Not Found.' }]
  },
  { id: 'TC115', name: 'AuthExpiredTokenAction', type: 'API', posNeg: 'Negative', 
    desc: 'Reject actions with expired JWT.', 
    pre: 'Token timestamp in past.', 
    steps: [{ no: 'Step 1', desc: 'GET /tasks with expired token.', exp: 'Error 401 Unauthorized.' }]
  },
  { id: 'TC116', name: 'CreateTagDuplicateCase', type: 'API', posNeg: 'Negative', 
    desc: 'Tags are case-insensitive duplicates.', 
    pre: 'Tag "WORK" exists.', 
    steps: [{ no: 'Step 1', desc: 'POST /tags with name "work".', exp: 'Error 400: Tag name already exists.' }]
  },
  { id: 'TC117', name: 'SubtaskInvalidParent', type: 'API', posNeg: 'Negative', 
    desc: 'Add subtask to invalid parent ID.', 
    pre: 'Auth token active.', 
    steps: [{ no: 'Step 1', desc: 'POST /subtasks with task_id: 0.', exp: 'Error 404: Task not found.' }]
  },
  { id: 'TC118', name: 'TaskFetchSearchTooLong', type: 'API', posNeg: 'Negative', 
    desc: 'Limit search query string length.', 
    pre: 'Auth token active.', 
    steps: [{ no: 'Step 1', desc: 'GET /tasks?q={5000 chars}.', exp: 'Error 414 Request-URI Too Large or 400.' }]
  },
  { id: 'TC119', name: 'ProjectNameMaxBoundary', type: 'API', posNeg: 'Positive', 
    desc: 'Create project with exactly 50 chars.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'POST /projects with 50 char name.', exp: 'Success 201.' }]
  },
  { id: 'TC120', name: 'ProjectNameExceedBoundary', type: 'API', posNeg: 'Negative', 
    desc: 'Create project with 51 chars fails.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'POST /projects with 51 char name.', exp: 'Error 422: too long.' }]
  },
  { id: 'TC121', name: 'TaskUpdateNoFields', type: 'API', posNeg: 'Negative', 
    desc: 'Reject PUT with empty body.', 
    pre: 'Task exists.', 
    steps: [{ no: 'Step 1', desc: 'PUT /tasks/{id} with {}.', exp: 'Error 400: No fields to update.' }]
  },
  { id: 'TC122', name: 'SubtaskUpdateNonexistent', type: 'API', posNeg: 'Negative', 
    desc: 'Update subtask that doesn\'t exist.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'PUT /subtasks/999.', exp: 'Error 404 Not Found.' }]
  },
  { id: 'TC123', name: 'TagUpdateNonexistent', type: 'API', posNeg: 'Negative', 
    desc: 'Update tag that doesn\'t exist.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'PUT /tags/999.', exp: 'Error 404 Not Found.' }]
  },
  { id: 'TC124', name: 'AuthNoCookie', type: 'API', posNeg: 'Negative', 
    desc: 'Reject request without HttpOnly cookie.', 
    pre: 'Cookie cleared.', 
    steps: [{ no: 'Step 1', desc: 'GET /api/v1/users/me.', exp: 'Error 401 Unauthorized.' }]
  },
  { id: 'TC125', name: 'IdempotencyKeyReuse', type: 'API', posNeg: 'Positive', 
    desc: 'Reuse of key returns cached response.', 
    pre: 'Request already sent with Key X.', 
    steps: [{ no: 'Step 1', desc: 'Send same POST with Key X.', exp: 'Returns original 201 response, no duplicate created.' }]
  },
  { id: 'TC126', name: 'RateLimitHeaders', type: 'API', posNeg: 'Positive', 
    desc: 'Verify rate limit headers presence.', 
    pre: 'Any successful request.', 
    steps: [{ no: 'Step 1', desc: 'Check response headers.', exp: 'X-RateLimit-Limit and X-RateLimit-Remaining exist.' }]
  },
  { id: 'TC127', name: 'SQLiInSearchQuery', type: 'API', posNeg: 'Positive', 
    desc: 'Sanitize search query against SQLi.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'GET /tasks?q=\' OR 1=1 --', exp: 'Returns empty list or exact match, no injection.' }]
  },
  { id: 'TC128', name: 'LargePayloadRejection', type: 'API', posNeg: 'Negative', 
    desc: 'Reject huge JSON payloads.', 
    pre: 'Auth active.', 
    steps: [{ no: 'Step 1', desc: 'POST /tasks with 10MB JSON.', exp: 'Error 413 Payload Too Large.' }]
  },
  { id: 'TC129', name: 'CORSRejection', type: 'API', posNeg: 'Negative', 
    desc: 'Reject requests from unauthorized origins.', 
    pre: 'Request from evil.com.', 
    steps: [{ no: 'Step 1', desc: 'Check Preflight OPTIONS.', exp: 'Access-Control-Allow-Origin header missing or different.' }]
  },
  { id: 'TC130', name: 'SecureHeadersCheck', type: 'API', posNeg: 'Positive', 
    desc: 'Verify security headers (HSTS, No-Sniff).', 
    pre: 'Any response.', 
    steps: [{ no: 'Step 1', desc: 'Check headers.', exp: 'Strict-Transport-Security, X-Content-Type-Options: nosniff present.' }]
  },

  // UI/UX Interaction Details (TC131 - TC155)
  { id: 'TC131', name: 'TaskCardHoverActions', type: 'Sys', posNeg: 'Positive', 
    desc: 'Quick actions appear on task card hover.', 
    pre: 'Mouse user.', 
    steps: [{ no: 'Step 1', desc: 'Hover over a task card.', exp: 'Edit and Delete icons become visible.' }]
  },
  { id: 'TC132', name: 'TaskDrawerClickOutside', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clicking overlay closes drawer.', 
    pre: 'Task Drawer open.', 
    steps: [{ no: 'Step 1', desc: 'Click background dimmed area.', exp: 'Drawer slides closed.' }]
  },
  { id: 'TC133', name: 'TaskDrawerEscKey', type: 'Sys', posNeg: 'Positive', 
    desc: 'Esc key closes drawer.', 
    pre: 'Task Drawer open.', 
    steps: [{ no: 'Step 1', desc: 'Press Escape.', exp: 'Drawer slides closed.' }]
  },
  { id: 'TC134', name: 'SubtaskSectionCollapse', type: 'Sys', posNeg: 'Positive', 
    desc: 'Accordion behavior for subtasks.', 
    pre: 'Task has many subtasks.', 
    steps: [{ no: 'Step 1', desc: 'Click Subtasks header in drawer.', exp: 'List collapses; toggle icon rotates.' }]
  },
  { id: 'TC135', name: 'ProjectIconPicker', type: 'Sys', posNeg: 'Positive', 
    desc: 'Select icon for project.', 
    pre: 'Edit Project modal.', 
    steps: [{ no: 'Step 1', desc: 'Click an icon (e.g. Heart).', exp: 'Icon selected and shown in preview.' }]
  },
  { id: 'TC136', name: 'ResponsiveGridResize', type: 'Sys', posNeg: 'Positive', 
    desc: 'Task grid adjusts to column count.', 
    pre: 'Large desktop view.', 
    steps: [{ no: 'Step 1', desc: 'Reduce window width to tablet.', exp: '3 columns become 2 columns.' }]
  },
  { id: 'TC137', name: 'SidebarScrollOverflow', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sidebar handles many projects/tags.', 
    pre: 'User has 30 projects.', 
    steps: [{ no: 'Step 1', desc: 'Look at sidebar.', exp: 'Sidebar is scrollable independently of main content.' }]
  },
  { id: 'TC138', name: 'EmptySearchStateIllustration', type: 'Sys', posNeg: 'Positive', 
    desc: 'Visual feedback for no results.', 
    pre: 'Search active with no matches.', 
    steps: [{ no: 'Step 1', desc: 'Observe main area.', exp: 'Illustration and "No tasks match your search" text shown.' }]
  },
  { id: 'TC139', name: 'ToastAutoDismiss', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toasts disappear after 5s.', 
    pre: 'Success toast shown.', 
    steps: [{ no: 'Step 1', desc: 'Wait 5 seconds.', exp: 'Toast fades out automatically.' }]
  },
  { id: 'TC140', name: 'ToastManualDismiss', type: 'Sys', posNeg: 'Positive', 
    desc: 'Clicking toast dismisses it.', 
    pre: 'Toast shown.', 
    steps: [{ no: 'Step 1', desc: 'Click toast body.', exp: 'Toast disappears immediately.' }]
  },
  { id: 'TC141', name: 'FocusTrapModal', type: 'Sys', posNeg: 'Positive', 
    desc: 'Tabbing stays within modal.', 
    pre: 'Add Task modal open.', 
    steps: [{ no: 'Step 1', desc: 'Tab through all fields.', exp: 'Focus circles back to first field, never hits background.' }]
  },
  { id: 'TC142', name: 'SmartListBadgeUpdate', type: 'Sys', posNeg: 'Positive', 
    desc: 'Today badge updates when task added.', 
    pre: 'Today count is 0.', 
    steps: [{ no: 'Step 1', desc: 'Create task with due date = Today.', exp: 'Today badge in sidebar shows "1".' }]
  },
  { id: 'TC143', name: 'MobileBottomNavSwitch', type: 'Sys', posNeg: 'Positive', 
    desc: 'Switch views via bottom bar.', 
    pre: 'Mobile viewport.', 
    steps: [{ no: 'Step 1', desc: 'Tap "Dashboard" icon.', exp: 'Main content switches to statistics view.' }]
  },
  { id: 'TC144', name: 'TimePickerManualEntry', type: 'Sys', posNeg: 'Positive', 
    desc: 'Type time instead of using slider.', 
    pre: 'Time picker open.', 
    steps: [{ no: 'Step 1', desc: 'Type "14:30" in inputs.', exp: 'Time set to 2:30 PM.' }]
  },
  { id: 'TC145', name: 'ColorContrastAccessibility', type: 'Sys', posNeg: 'Positive', 
    desc: 'Verify text contrast on colored tags.', 
    pre: 'Dark blue tag created.', 
    steps: [{ no: 'Step 1', desc: 'Inspect tag text.', exp: 'Text is white (automatic light/dark text selection).' }]
  },
  { id: 'TC146', name: 'TaskCardKeyboardAction', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toggle task via keyboard Space.', 
    pre: 'Focus on task card checkbox.', 
    steps: [{ no: 'Step 1', desc: 'Press Space.', exp: 'Task toggles completion.' }]
  },
  { id: 'TC147', name: 'SidebarTooltipsCollapsed', type: 'Sys', posNeg: 'Positive', 
    desc: 'Tooltips show full name on hover.', 
    pre: 'Sidebar collapsed.', 
    steps: [{ no: 'Step 1', desc: 'Hover over Project icon.', exp: 'Tooltip appears with project name.' }]
  },
  { id: 'TC148', name: 'DragHandleVisibility', type: 'Sys', posNeg: 'Positive', 
    desc: 'Handles only visible on hover.', 
    pre: 'Sidebar expanded.', 
    steps: [{ no: 'Step 1', desc: 'Hover over a tag.', exp: 'Vertical grip handle appears on the left.' }]
  },
  { id: 'TC149', name: 'BulkSelectDeselectAll', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toggle all checkboxes.', 
    pre: 'Multiple tasks in view.', 
    steps: [{ no: 'Step 1', desc: 'Click "Select All" checkbox.', exp: 'All tasks highlighted.' },
            { no: 'Step 2', desc: 'Click again.', exp: 'All tasks deselected.' }]
  },
  { id: 'TC150', name: 'LoadingStateSkeletons', type: 'Sys', posNeg: 'Positive', 
    desc: 'Dashboard shows skeletons on mount.', 
    pre: 'Initial load.', 
    steps: [{ no: 'Step 1', desc: 'Slow down network and refresh.', exp: 'Ghost cards shown while fetching.' }]
  },

  // Complex Task Interactions (TC151 - TC175)
  { id: 'TC151', name: 'RecurringTaskSimulation', type: 'Sys', posNeg: 'Positive', 
    desc: 'Check behavior when user manually duplicates task.', 
    pre: 'Task exists.', 
    steps: [{ no: 'Step 1', desc: 'Select "Duplicate" from task menu.', exp: 'New task copy created with " (Copy)" suffix.' }]
  },
  { id: 'TC152', name: 'TaskWith10TagsAnd50Subtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Max density task performance.', 
    pre: 'Create extreme task.', 
    steps: [{ no: 'Step 1', desc: 'Open extreme task in drawer.', exp: 'Drawer loads smoothly; scrolling is 60fps.' }]
  },
  { id: 'TC153', name: 'FilterTodayAndHighPriority', type: 'Sys', posNeg: 'Positive', 
    desc: 'Combined smart list filtering.', 
    pre: 'Tasks of various dates and priorities exist.', 
    steps: [{ no: 'Step 1', desc: 'Select Today, then filter by High Priority.', exp: 'Shows only High Priority tasks due today.' }]
  },
  { id: 'TC154', name: 'DueDateRelativeLabels', type: 'Sys', posNeg: 'Positive', 
    desc: 'Labels update correctly (Tomorrow, Next Week).', 
    pre: 'Task due in 24h.', 
    steps: [{ no: 'Step 1', desc: 'Look at task card.', exp: 'Badge says "Tomorrow".' }]
  },
  { id: 'TC155', name: 'OverdueTaskStyling', type: 'Sys', posNeg: 'Positive', 
    desc: 'Overdue tasks highlighted in red.', 
    pre: 'Task due yesterday.', 
    steps: [{ no: 'Step 1', desc: 'Look at list.', exp: 'Due date text is red; overdue icon appears.' }]
  },
  { id: 'TC156', name: 'TaskDescriptionMaxHeight', type: 'Sys', posNeg: 'Positive', 
    desc: 'Long descriptions don\'t break layout.', 
    pre: 'Task with 2000 char desc.', 
    steps: [{ no: 'Step 1', desc: 'Open Task Drawer.', exp: 'Description area is scrollable; drawer height remains fixed.' }]
  },
  { id: 'TC157', name: 'AutoSavingDrawerChanges', type: 'Sys', posNeg: 'Positive', 
    desc: 'Changes save on blur.', 
    pre: 'Task Drawer open.', 
    steps: [{ no: 'Step 1', desc: 'Edit title and click outside drawer.', exp: 'Network call triggered; title saved.' }]
  },
  { id: 'TC158', name: 'DirtyStateWarning', type: 'Sys', posNeg: 'Positive', 
    desc: 'Warn if closing drawer during active upload.', 
    pre: 'Uploading attachment/change.', 
    steps: [{ no: 'Step 1', desc: 'Attempt to close drawer during sync.', exp: 'Loading spinner shows on close button or warning shown.' }]
  },
  { id: 'TC159', name: 'InboxAutoAssign', type: 'Sys', posNeg: 'Positive', 
    desc: 'New tasks go to Inbox if no project.', 
    pre: 'Inbox view.', 
    steps: [{ no: 'Step 1', desc: 'Add task without choosing project.', exp: 'Task appears in Inbox smart list.' }]
  },
  { id: 'TC160', name: 'ProjectCompletionProgress', type: 'Sys', posNeg: 'Positive', 
    desc: 'Project badge shows stats.', 
    pre: 'Project with 5 tasks, 2 completed.', 
    steps: [{ no: 'Step 1', desc: 'Look at sidebar project.', exp: 'Badge shows 2/5 or progress ring.' }]
  },

  // Security & Resilience (TC161 - TC185)
  { id: 'TC161', name: 'PasswordBruteForceProtection', type: 'Sys', posNeg: 'Negative', 
    desc: 'Lock account after 5 failed logins.', 
    pre: 'Attempt 5 wrong passwords.', 
    steps: [{ no: 'Step 1', desc: 'Attempt 6th login.', exp: 'Error: "Too many attempts. Account locked for 15 mins".' }]
  },
  { id: 'TC162', name: 'TokenInLocalStorageCheck', type: 'Sys', posNeg: 'Negative', 
    desc: 'Ensure no sensitive data in LocalStorage.', 
    pre: 'Logged in.', 
    steps: [{ no: 'Step 1', desc: 'Inspect LocalStorage.', exp: 'No JWT or user secrets found (should be in HttpOnly cookie).' }]
  },
  { id: 'TC163', name: 'SanitizeTaskTitleInHeader', type: 'Sys', posNeg: 'Positive', 
    desc: 'XSS prevention in page title.', 
    pre: 'Task title contains script tag.', 
    steps: [{ no: 'Step 1', desc: 'Observe Browser Tab Title.', exp: 'Script tags escaped; no execution.' }]
  },
  { id: 'TC164', name: 'ConcurrentProjectDelete', type: 'Sys', posNeg: 'Edge', 
    desc: 'Handle task update on deleted project.', 
    pre: 'Tab A deleting project, Tab B updating task in same project.', 
    steps: [{ no: 'Step 1', desc: 'Perform both.', exp: 'Update fails gracefully with "Project not found".' }]
  },
  { id: 'TC165', name: 'OfflineTokenExpiry', type: 'Sys', posNeg: 'Negative', 
    desc: 'Force login if token expires while offline.', 
    pre: 'Offline for long time; token expired.', 
    steps: [{ no: 'Step 1', desc: 'Go online.', exp: 'Immediate redirect to login; local changes preserved till re-auth.' }]
  },
  { id: 'TC166', name: 'LargeAttachmentRejection', type: 'Sys', posNeg: 'Negative', 
    desc: 'Limit file size (if attachments added).', 
    pre: 'Attempt to upload 50MB file.', 
    steps: [{ no: 'Step 1', desc: 'Select file.', exp: 'Error: "File too large (max 5MB)".' }]
  },
  { id: 'TC167', name: 'TaskOrderCorruptionRecovery', type: 'Sys', posNeg: 'Edge', 
    desc: 'Fix corrupted sort orders.', 
    pre: 'Two tasks have same order index.', 
    steps: [{ no: 'Step 1', desc: 'Load list.', exp: 'Frontend logic fallback to created_at; warning logged.' }]
  },
  { id: 'TC168', name: 'ApiVersioningBackcompat', type: 'API', posNeg: 'Positive', 
    desc: 'Legacy clients work with /v1.', 
    pre: 'Backend has v1 and v2.', 
    steps: [{ no: 'Step 1', desc: 'GET /api/v1/tasks.', exp: 'Returns tasks in v1 schema format.' }]
  },
  { id: 'TC169', name: 'DatabaseDeadlockRecovery', type: 'API', posNeg: 'Edge', 
    desc: 'Retry logic for DB deadlocks.', 
    pre: 'Backend simulates 1213 error.', 
    steps: [{ no: 'Step 1', desc: 'Send update.', exp: 'Backend retries 3 times then succeeds or returns 503.' }]
  },
  { id: 'TC170', name: 'LogSanitization', type: 'API', posNeg: 'Positive', 
    desc: 'Passwords not logged in plain text.', 
    pre: 'Registration failure.', 
    steps: [{ no: 'Step 1', desc: 'Inspect server logs.', exp: 'Password field is masked: "****".' }]
  },

  // Accessibility (A11y) (TC171 - TC185)
  { id: 'TC171', name: 'ScreenReaderAnnounceDelete', type: 'Sys', posNeg: 'Positive', 
    desc: 'Deletion is announced.', 
    pre: 'Screen reader active.', 
    steps: [{ no: 'Step 1', desc: 'Confirm task delete.', exp: '"Task deleted" announced via ARIA live region.' }]
  },
  { id: 'TC172', name: 'HighContrastModeCheck', type: 'Sys', posNeg: 'Positive', 
    desc: 'Readable in Windows High Contrast.', 
    pre: 'OS level High Contrast on.', 
    steps: [{ no: 'Step 1', desc: 'Open app.', exp: 'Borders and focus states clearly visible.' }]
  },
  { id: 'TC173', name: 'FontSizeScaling', type: 'Sys', posNeg: 'Positive', 
    desc: 'Layout doesn\'t break at 200% zoom.', 
    pre: 'Browser zoom 200%.', 
    steps: [{ no: 'Step 1', desc: 'Navigate app.', exp: 'Text wraps; no horizontal scroll on mobile; buttons accessible.' }]
  },
  { id: 'TC174', name: 'AriaLabelsOnIcons', type: 'Sys', posNeg: 'Positive', 
    desc: 'Icons have descriptive names.', 
    pre: 'Inspect HTML.', 
    steps: [{ no: 'Step 1', desc: 'Check "plus" icon.', exp: 'aria-label="Create new project" present.' }]
  },
  { id: 'TC175', name: 'KeyboardNavSubtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Subtasks reachable via Tab.', 
    pre: 'Drawer open.', 
    steps: [{ no: 'Step 1', desc: 'Tab through drawer.', exp: 'Every subtask checkbox and delete icon can be focused.' }]
  },

  // User Profile & Settings (TC186 - TC200)
  { id: 'TC186', name: 'UpdateUsername', type: 'Sys', posNeg: 'Positive', 
    desc: 'Change user display name.', 
    pre: 'Settings page open.', 
    steps: [{ no: 'Step 1', desc: 'Enter new name.', exp: 'Name updated in top nav immediately.' }]
  },
  { id: 'TC187', name: 'ChangePasswordValid', type: 'Sys', posNeg: 'Positive', 
    desc: 'Update password with old password.', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Enter old, new, confirm password.', exp: 'Password updated; success toast.' }]
  },
  { id: 'TC188', name: 'ChangePasswordInvalidOld', type: 'Sys', posNeg: 'Negative', 
    desc: 'Fail update with wrong old password.', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Enter incorrect current password.', exp: 'Error: "Current password incorrect".' }]
  },
  { id: 'TC189', name: 'UploadAvatar', type: 'Sys', posNeg: 'Positive', 
    desc: 'Set profile picture.', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Upload valid PNG.', exp: 'Avatar appears in header.' }]
  },
  { id: 'TC190', name: 'DeleteAccountConfirmation', type: 'Sys', posNeg: 'Negative', 
    desc: 'Account deletion requires confirm string.', 
    pre: 'Settings -> Danger Zone.', 
    steps: [{ no: 'Step 1', desc: 'Click Delete Account.', exp: 'Modal asks to type "DELETE".' },
            { no: 'Step 2', desc: 'Type wrong string.', exp: 'Delete button disabled.' }]
  },
  { id: 'TC191', name: 'NotificationPreferences', type: 'Sys', posNeg: 'Positive', 
    desc: 'Toggle email notifications.', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Toggle "Email Alerts" off.', exp: 'Preference saved to DB.' }]
  },
  { id: 'TC192', name: 'ThemeAutoDetection', type: 'Sys', posNeg: 'Positive', 
    desc: 'Follow system dark/light mode.', 
    pre: 'Theme set to "System".', 
    steps: [{ no: 'Step 1', desc: 'Change OS to Dark.', exp: 'App switches to dark theme automatically.' }]
  },
  { id: 'TC193', name: 'LanguageSwitchSupport', type: 'Sys', posNeg: 'Positive', 
    desc: 'Change UI language (if i18n added).', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Select "Spanish".', exp: 'Labels change to "Tareas", "Proyectos".' }]
  },
  { id: 'TC194', name: 'SessionManagementList', type: 'Sys', posNeg: 'Positive', 
    desc: 'See active devices.', 
    pre: 'Logged in on 2 devices.', 
    steps: [{ no: 'Step 1', desc: 'Check "Active Sessions".', exp: '2 devices listed with IP/Browser.' }]
  },
  { id: 'TC195', name: 'RevokeOtherSession', type: 'Sys', posNeg: 'Positive', 
    desc: 'Logout remote device.', 
    pre: 'Settings page.', 
    steps: [{ no: 'Step 1', desc: 'Click Logout on other session.', exp: 'That device is forced to login page.' }]
  },

  // Final Edge & Stress (TC201 - TC215)
  { id: 'TC201', name: 'RapidCreationStress', type: 'Sys', posNeg: 'Negative', 
    desc: 'Spam creation button.', 
    pre: 'Add task modal.', 
    steps: [{ no: 'Step 1', desc: 'Click "Create" 20 times rapidly.', exp: 'Only 1 task created (due to button disabling or idempotency).' }]
  },
  { id: 'TC202', name: 'DeepLinkDirectTask', type: 'Sys', posNeg: 'Positive', 
    desc: 'Navigate to task via URL.', 
    pre: 'Task ID 123 exists.', 
    steps: [{ no: 'Step 1', desc: 'Navigate to /tasks/123.', exp: 'Task Drawer open automatically on load.' }]
  },
  { id: 'TC203', name: 'PasteMultiLineSubtasks', type: 'Sys', posNeg: 'Positive', 
    desc: 'Create multiple subtasks from paste.', 
    pre: 'Add subtask input.', 
    steps: [{ no: 'Step 1', desc: 'Paste "A\nB\nC".', exp: '3 separate subtasks created.' }]
  },
  { id: 'TC204', name: 'FilterByTagIntersection', type: 'Sys', posNeg: 'Positive', 
    desc: 'AND logic for tags.', 
    pre: 'Tasks with Tags [A], [B], [A,B].', 
    steps: [{ no: 'Step 1', desc: 'Select Tag A and Tag B.', exp: 'Only task [A,B] is shown.' }]
  },
  { id: 'TC205', name: 'DragTaskBetweenProjects', type: 'Sys', posNeg: 'Positive', 
    desc: 'Move task via sidebar drag.', 
    pre: 'Task Card visible.', 
    steps: [{ no: 'Step 1', desc: 'Drag Task A onto Project B icon in sidebar.', exp: 'Task project updated to B.' }]
  },
  { id: 'TC206', name: 'BrowserBackNavigation', type: 'Sys', posNeg: 'Positive', 
    desc: 'History state consistency.', 
    pre: 'Navigate All -> Project A -> Today.', 
    steps: [{ no: 'Step 1', desc: 'Click Browser Back.', exp: 'Returns to Project A view.' }]
  },
  { id: 'TC207', name: 'SearchHighlighting', type: 'Sys', posNeg: 'Positive', 
    desc: 'Matched text is highlighted.', 
    pre: 'Search for "milk".', 
    steps: [{ no: 'Step 1', desc: 'Look at task title.', exp: '"milk" is wrapped in <mark> tag or yellow bg.' }]
  },
  { id: 'TC208', name: 'AutoLogoutOnTokenKill', type: 'Sys', posNeg: 'Edge', 
    desc: 'Logout when cookie cleared in devtools.', 
    pre: 'Logged in.', 
    steps: [{ no: 'Step 1', desc: 'Delete access_token cookie.', exp: 'App detects via polling or next request and redirects to login.' }]
  },
  { id: 'TC209', name: 'EmptyInboxIllustration', type: 'Sys', posNeg: 'Positive', 
    desc: 'Positive reinforcement when Inbox zero.', 
    pre: '0 tasks in Inbox.', 
    steps: [{ no: 'Step 1', desc: 'View Inbox.', exp: '"All clear!" message shown.' }]
  },
  { id: 'TC210', name: 'TaskCardDateColoring', type: 'Sys', posNeg: 'Positive', 
    desc: 'Date turns orange if due today.', 
    pre: 'Task due today.', 
    steps: [{ no: 'Step 1', desc: 'Observe date badge.', exp: 'Text is orange.' }]
  },
  { id: 'TC211', name: 'SubtaskCheckboxAnimation', type: 'Sys', posNeg: 'Positive', 
    desc: 'Smooth check animation.', 
    pre: 'Drawer open.', 
    steps: [{ no: 'Step 1', desc: 'Click subtask checkbox.', exp: 'Lottie or CSS animation plays; strike-through occurs.' }]
  },
  { id: 'TC212', name: 'SidebarResponsiveHide', type: 'Sys', posNeg: 'Positive', 
    desc: 'Sidebar hides on small mobile.', 
    pre: 'Viewport < 640px.', 
    steps: [{ no: 'Step 1', desc: 'Open page.', exp: 'Sidebar not shown by default; hamburger only.' }]
  },
  { id: 'TC213', name: 'SessionPersistenceAcrossTabs', type: 'Sys', posNeg: 'Positive', 
    desc: 'Login in Tab A logs in Tab B.', 
    pre: 'Two tabs on /login.', 
    steps: [{ no: 'Step 1', desc: 'Login in Tab A.', exp: 'Tab B automatically redirects to /tasks via broadcast channel or state check.' }]
  },
  { id: 'TC214', name: 'ConcurrentTagRename', type: 'Sys', posNeg: 'Edge', 
    desc: 'Two users renaming same tag.', 
    pre: 'Tag "Old". User A and B both editing.', 
    steps: [{ no: 'Step 1', desc: 'User A saves "New1". User B saves "New2".', exp: 'Last Write Wins (New2) or Conflict error.' }]
  },
  { id: 'TC215', name: 'FinalVerificationSuite', type: 'Sys', posNeg: 'Positive', 
    desc: 'All 215 tests categorized.', 
    pre: 'Documentation review.', 
    steps: [{ no: 'Step 1', desc: 'Check category distribution.', exp: 'All core and edge modules covered.' }]
  }
];

let markdown = `# Task Buddy — Comprehensive System Test Cases

This document defines the system-level and integration-level test cases for the Task Buddy application. All test scenarios strictly conform to the QA specification guidelines: zero-padded scenario naming, 8-column design structure, and blank metadata columns on subsequent rows to denote visual nesting.

---

## 📋 System Test Cases (Design-Time Specification)

| TEST CASE NAME                                | POSITIVE/ NEGATIVE | TYPE | DESCRIPTION                                                     | PRE-CONDITION                                    | TEST STEP NO. | TEST STEP DESCRIPTION                            | TEST EXPECTED RESULT                                  |
| :-------------------------------------------- | :----------------- | :--- | :-------------------------------------------------------------- | :----------------------------------------------- | :------------ | :----------------------------------------------- | :---------------------------------------------------- |
`;

for (const tc of testCases) {
  const name = `${tc.id}_${tc.type}_${tc.posNeg === 'Positive' ? 'Pos' : 'Neg'}_${tc.name}`;
  
  for (let i = 0; i < tc.steps.length; i++) {
    const step = tc.steps[i];
    if (i === 0) {
      markdown += `| \`${name}\` | ${tc.posNeg} | ${tc.type} | ${tc.desc} | ${tc.pre} | ${step.no} | ${step.desc} | ${step.exp} |\n`;
    } else {
      markdown += `| | | | | | ${step.no} | ${step.desc} | ${step.exp} |\n`;
    }
  }
}

fs.writeFileSync('quality/TEST_CASES.md', markdown);
console.log('Successfully generated TEST_CASES.md');
