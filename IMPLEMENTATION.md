# Task-Buddy Frontend - Implementation Guide

## 🎨 Design System & Brand Identity

### Color Palette (Mandatory Hex Codes)

- **Primary Background**: `#F1F5F9` (Pale, cool-toned gray/blue)
- **Card/Surface**: `#FFFFFF` (Pure white)
- **Sidebar/Primary**: `#0F172A` (Deep dark navy blue)
- **Brand Accent**: `#C2A388` (Warm, muted tan)
- **Muted Surface**: `#EDE9E6` (Light, warm-toned beige)

### Tailwind Configuration

All brand colors are mapped in `tailwind.config.js`:

```javascript
colors: {
  "brand-bg": "#F1F5F9",
  "brand-card": "#FFFFFF",
  "brand-sidebar": "#0F172A",
  "brand-accent": "#C2A388",
  "brand-muted": "#EDE9E6",
}
```

## 🏗️ Architecture

### Authentication Flow

- **AuthContext** (`src/contexts/AuthContext.tsx`): Manages JWT tokens, user state, login/register
- **ProtectedRoute**: Guards routes requiring authentication
- **PublicRoute**: Prevents authenticated users from accessing auth pages
- Tokens stored in localStorage for persistence

### State Management

- React Context API for auth state
- Hooks pattern for API interactions (`useApi.ts`)
- Framer Motion for animations and transitions

### Routing

- React Router v6 with protected routes
- `/login` - Public login page
- `/register` - Public registration page
- `/dashboard` - Protected dashboard with sidebar and top nav
- `/` - Root redirects to dashboard if authenticated, else to login

## 📄 Pages & Components

### Authentication Pages

#### LoginPage (`src/pages/LoginPage.tsx`)

- Centered card layout with brand branding
- Email and password inputs with validation
- "Sign in" button with dark navy background
- Link to register page
- Framer Motion entrance animations

#### RegisterPage (`src/pages/RegisterPage.tsx`)

- Similar layout to login but with three fields
- Email, Password (8+ chars), Confirm Password
- Password validation (must match & minimum 8 chars)
- Error handling and display
- Smooth animated entrance

### Dashboard Components

#### TopNav (`src/components/topnav.tsx`)

- **Greeting**: Displays "Good Morning/Afternoon/Evening" based on time
- **Search**: Global search input with icon
- **New Task Button**: High-impact tan accent button
- **Settings**: Icon button for settings
- Responsive design with animations on hover

#### Sidebar (`src/components/sidebar.tsx`)

- **Dark Navy Background**: Brand primary color (#0F172A)
- **Logo Section**: Task-Buddy branding with icon
- **Navigation**: Dashboard and Audit Logs links
- **Filters**: Task categories (All, Work, Personal, School, Health)
- **User Info**: Shows logged-in email
- **Logout Button**: Dark red accent with logout icon
- Active state styling with brand accent color

#### SystemOverview (`src/components/system-overview.tsx`)

- **Percentage Display**: Large animated number showing completion %
- **Progress Bar**: Uses brand accent tan color (#C2A388)
- **Stats Grid**: Total tasks vs completed tasks
- **Animations**: Scale and slide animations on mount
- **Responsive**: Adapts to different screen sizes

#### AuditTrail (`src/components/audit-trail.tsx`)

- **Activity Feed**: Shows recent task completions and system events
- **Status Indicators**: Green checkmarks for completed, blue for system
- **Timestamps**: Shows "just now", "2h ago", etc.
- **Animation**: Staggered entrance of activity items
- **Responsive**: Shows up to 10 most recent entries

#### TaskCard (`src/components/task-card.tsx`)

- **Title & Description**: Displays task details
- **Category Badge**: Color-coded badges (work, personal, school, health)
- **Priority Badge**: Visual priority levels (low, medium, high)
- **Due Date**: Calendar icon with due date
- **Actions**: Edit and delete buttons
- **Interactive**: Hover effects and scale animations
- **Completion State**: Strikethrough and opacity when completed

#### Dashboard (`src/components/dashboard.tsx`)

- **Two-Column Layout**: System Overview (left) + Task List (right)
- **Task Tabs**: Filter by ALL, PENDING, COMPLETED
- **Audit Trail**: Activity feed at bottom
- **Animations**: Staggered entrance of components and task items
- **Modal Integration**: New Task creation modal

### Modals & UI Elements

#### NewTaskModal (`src/components/new-task-modal.tsx`)

- **Form Fields**: Title\*, Description, Priority, Category, Due Date
- **Validation**: Title required, password 8+ chars
- **Animation**: Smooth entrance with staggered field animations
- **Styling**: Uses brand colors and border styles
- **Cancel/Create**: Action buttons

## ✨ Motion & Interactivity

### Framer Motion Integration

All major components include smooth animations:

- **Entrance Animations**: Scale and opacity on mount
- **Hover States**: Scale transforms on interactive elements
- **Tap Feedback**: Subtle scale-down on click
- **List Animations**: Staggered entrance of list items
- **Page Transitions**: Smooth fade and slide transitions

### Interactive Feedback

- Buttons scale down on hover (1.05x scale)
- List items slide in on mount
- Modal content animates on open
- Progress bar animates to target percentage
- Activity feed items fade in with slight delay

## 🔌 API Integration

### Backend Connection

- FastAPI backend expected at `http://127.0.0.1:8000`
- Base URL configurable via `VITE_API_BASE_URL` env var
- JWT Bearer token authentication

### API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/me` - Get current user (for token validation)
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/stats` - Get task statistics
- `GET /api/audit-logs` - Get audit trail

## 🚀 Development Setup

### Installation

```bash
npm install
```

### Start Dev Server

```bash
npm run dev
```

Server runs on `http://localhost:5175` (or next available port)

### Build for Production

```bash
npm run build
```

Output in `dist/` directory

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx       # Auth state & JWT management
│   └── ProtectedRoute.tsx    # Route guards
├── pages/
│   ├── LoginPage.tsx         # Login form
│   ├── RegisterPage.tsx      # Registration form
│   └── DashboardDemo.tsx     # Dashboard layout demo
├── components/
│   ├── dashboard.tsx         # Main dashboard layout
│   ├── sidebar.tsx           # Sidebar navigation
│   ├── topnav.tsx           # Top navigation bar
│   ├── system-overview.tsx   # Stats and progress
│   ├── audit-trail.tsx       # Activity feed
│   ├── task-card.tsx         # Individual task card
│   ├── new-task-modal.tsx    # Create task modal
│   ├── theme-provider.tsx    # Dark/light theme
│   └── ui/                   # shadcn/ui primitives
├── hooks/
│   └── useApi.ts            # API calls & data fetching
├── lib/
│   └── utils.ts             # Utility functions
├── App.tsx                   # Main router & layout
├── main.tsx                  # Entry point
└── index.css                 # Global styles & theme
```

## 🎯 Key Features Implemented

### ✅ Authentication

- [x] Login page with validation
- [x] Registration with password confirmation
- [x] JWT token management
- [x] Token persistence in localStorage
- [x] Protected routes
- [x] Logout functionality

### ✅ Dashboard Layout

- [x] Dark navy sidebar with brand colors
- [x] Top navigation with time-based greeting
- [x] System overview widget with progress bar
- [x] Task list with filtering (all/pending/completed)
- [x] Audit trail activity feed
- [x] Category and priority badges

### ✅ Task Management

- [x] Create task modal
- [x] Mark tasks complete/incomplete
- [x] Delete tasks
- [x] Filter by status
- [x] Task metadata (priority, category, due date)

### ✅ Motion & Polish

- [x] Entrance animations for all pages
- [x] Hover state animations
- [x] Smooth transitions between pages
- [x] Staggered list animations
- [x] Scale and opacity animations
- [x] Loading states with spinners

### ✅ Design Consistency

- [x] Light-mode premium aesthetic
- [x] Brand color palette applied throughout
- [x] Consistent spacing and typography
- [x] Accessible form inputs
- [x] Responsive layout
- [x] High-contrast text

## 🔐 Security Notes

1. **Token Storage**: Stored in localStorage (browser accessible)
   - For production, consider httpOnly cookies
2. **API Validation**: All tokens sent with `Authorization: Bearer` header

3. **Password Requirements**:
   - Minimum 8 characters enforced on register
4. **CORS**: Ensure FastAPI backend has proper CORS configuration

## 🧪 Testing the UI

### Without Backend

If backend isn't running, API calls will fail with 404s. The UI gracefully handles this:

- Task lists show empty state
- System overview shows 0 tasks
- Audit trail shows fallback mock data

### With Backend

Set `VITE_API_BASE_URL` env var to point to your FastAPI server:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## 📦 Dependencies

### Core

- react@19.2.4
- react-dom@19.2.4
- react-router-dom@latest
- typescript@5.9.3

### UI & Styling

- tailwindcss@4.2.1
- shadcn/ui components
- class-variance-authority@0.7.1
- lucide-react@1.14.0

### Motion

- framer-motion@latest

### API

- axios@latest

### Dev Tools

- vite@7.3.1
- eslint@9.39.4
- prettier@3.8.1

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change brand colors globally:

```javascript
colors: {
  "brand-bg": "#YOUR_COLOR",
  "brand-sidebar": "#YOUR_COLOR",
  // ...
}
```

### Animations

Adjust animation timing in component files:

```jsx
transition={{ duration: 0.3, delay: 0.1 }}
```

### Typography

Font is Geist Variable (imported via @fontsource-variable/geist)
Edit `src/index.css` to change font family

## 📝 Notes for Developers

1. **Auth Context**: Always wrap app with `<AuthProvider>`
2. **Protected Routes**: Use `<ProtectedRoute>` for authenticated pages
3. **API Calls**: Use hooks from `useApi.ts` for consistency
4. **Styling**: Use Tailwind classes and brand color utilities
5. **Animations**: Use Framer Motion's `motion` component for all animations
6. **Responsive**: Test on mobile (tailwind's `sm:`, `lg:`, `xl:` breakpoints)

## 🔄 Workflow

1. User lands on `/` → redirects to `/login` or `/dashboard` based on auth
2. New user clicks "Sign up" → goes to `/register`
3. User fills registration form → API call → sets token → redirects to `/dashboard`
4. Dashboard loads with sidebar, topnav, widgets, and task list
5. User can create, edit, delete tasks with modal interface
6. All interactions have smooth animations and feedback
7. Logout clears token and redirects to login

---

**Created**: May 5, 2026  
**Framework**: React 19 + Vite + TypeScript  
**Styling**: Tailwind CSS v4 + shadcn/ui  
**Motion**: Framer Motion  
**Status**: ✅ Complete implementation with all features
