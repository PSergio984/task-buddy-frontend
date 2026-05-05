# Task-Buddy API Integration Guide

## Overview

The Task-Buddy frontend communicates with a FastAPI backend at `http://127.0.0.1:8000` by default. All API calls are type-safe and integrated through React hooks in `src/hooks/useApi.ts`.

## Task Interface

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  category: "work" | "personal" | "school" | "health" | "other";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

The frontend expects the following endpoints from the FastAPI backend:

### GET /tasks
Fetch all tasks

**Response:**
```json
[
  {
    "id": "task-1",
    "title": "Complete project",
    "description": "Finish the frontend implementation",
    "status": "pending",
    "priority": "high",
    "category": "work",
    "dueDate": "2026-05-15T00:00:00",
    "createdAt": "2026-05-05T00:00:00",
    "updatedAt": "2026-05-05T00:00:00"
  }
]
```

**Frontend Hook:**
```typescript
const { tasks, loading, error } = useTasks();
```

---

### POST /tasks
Create a new task

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "category": "work",
  "dueDate": "2026-05-15T00:00:00",
  "status": "pending"
}
```

**Response:**
```json
{
  "id": "task-new-1",
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "category": "work",
  "dueDate": "2026-05-15T00:00:00",
  "createdAt": "2026-05-05T10:00:00",
  "updatedAt": "2026-05-05T10:00:00"
}
```

**Frontend Hook:**
```typescript
const { createTask, loading, error } = useCreateTask();

// Usage
try {
  const newTask = await createTask({
    title: "New Task",
    priority: "medium",
    category: "work",
    status: "pending"
  });
} catch (error) {
  console.error("Failed to create task:", error);
}
```

---

### PATCH /tasks/{id}
Update an existing task

**Request Body (partial update):**
```json
{
  "status": "completed",
  "priority": "high"
}
```

**Response:**
```json
{
  "id": "task-1",
  "title": "Complete project",
  "description": "Finish the frontend implementation",
  "status": "completed",
  "priority": "high",
  "category": "work",
  "dueDate": "2026-05-15T00:00:00",
  "createdAt": "2026-05-05T00:00:00",
  "updatedAt": "2026-05-05T11:00:00"
}
```

**Frontend Hook:**
```typescript
const { updateTask, loading, error } = useUpdateTask();

// Usage
try {
  const updated = await updateTask("task-1", {
    status: "completed"
  });
} catch (error) {
  console.error("Failed to update task:", error);
}
```

---

### DELETE /tasks/{id}
Delete a task

**Response:** 204 No Content (success) or error response

**Frontend Hook:**
```typescript
const { deleteTask, loading, error } = useDeleteTask();

// Usage
try {
  await deleteTask("task-1");
} catch (error) {
  console.error("Failed to delete task:", error);
}
```

---

## Error Handling

All API hooks provide error objects with meaningful messages:

```typescript
const { tasks, loading, error } = useTasks();

if (error) {
  console.error(error.message); // e.g., "Failed to fetch tasks: 500"
}
```

Common errors:
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Task or endpoint not found
- **500 Internal Server Error**: Server-side issue

## Request Headers

The frontend automatically sets the following headers:

```
Content-Type: application/json
```

## Base URL Configuration

The API base URL is configured via environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If not set, it defaults to `http://127.0.0.1:8000`.

## Loading States

Each hook provides a `loading` boolean that tracks request state:

```typescript
const { createTask, loading } = useCreateTask();

if (loading) {
  return <div>Creating task...</div>;
}
```

## Example Usage in Components

```typescript
import { useTasks, useUpdateTask } from "@/hooks/useApi";
import type { Task } from "@/hooks/useApi";

export function TaskComponent() {
  const { tasks, loading, error } = useTasks();
  const { updateTask } = useUpdateTask();

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, {
        status: task.status === "completed" ? "pending" : "completed"
      });
      // Refresh would happen here with proper state management
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.title}</span>
          <button onClick={() => handleToggleComplete(task)}>
            {task.status === "completed" ? "✓" : "○"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Future Enhancements

To extend the API integration:

1. **Real-time Updates**: Add WebSocket support for live task updates
2. **Pagination**: Implement offset/limit for large task lists
3. **Search**: Add full-text search endpoint
4. **Filtering**: Server-side filtering for better performance
5. **Sorting**: Add sort options for tasks
6. **Bulk Operations**: Batch update/delete endpoints

## Notes

- The frontend assumes the backend returns tasks in a consistent format
- Timestamps should be in ISO 8601 format (e.g., "2026-05-05T10:00:00")
- All IDs should be strings
- The frontend handles both array responses and paginated responses: `{ items: [...], total: n }`
