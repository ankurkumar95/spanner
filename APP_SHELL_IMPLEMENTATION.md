# Spanner CRM - App Shell Implementation

## Overview
The frontend app shell for Spanner CRM has been successfully implemented with a complete routing structure, authentication flow, and dual-theme sidebar navigation.

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## File Structure

```
frontend/src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx      # Authentication guard component
│   └── layout/
│       ├── AppShell.tsx             # Main layout wrapper with Outlet
│       ├── Sidebar.tsx              # Dual-theme sidebar with navigation
│       └── Header.tsx               # Top header with user info
├── pages/
│   ├── Login.tsx                    # Login page matching design
│   ├── Dashboard.tsx                # Dashboard placeholder
│   ├── UserManagement.tsx           # User management placeholder
│   ├── Segments.tsx                 # Segments placeholder
│   ├── Companies.tsx                # Companies placeholder
│   ├── Contacts.tsx                 # Contacts placeholder
│   ├── Approvals.tsx                # Approval queue placeholder
│   └── SettingsPage.tsx             # Settings placeholder
├── stores/
│   ├── authStore.ts                 # Zustand auth state management
│   └── themeStore.ts                # Zustand theme state management
├── types/
│   └── index.ts                     # TypeScript interfaces
├── lib/
│   ├── api.ts                       # Axios instance with interceptors
│   └── utils.ts                     # Utility functions (cn)
├── App.tsx                          # Main routing configuration
├── main.tsx                         # App entry point
└── index.css                        # Global styles + scrollbar

```

## Key Features Implemented

### 1. Authentication System
- **Auth Store** (`stores/authStore.ts`):
  - Login/logout functionality
  - Token management (localStorage)
  - User state management
  - Axios header configuration
  - Auto-redirect on 401 responses

- **Protected Routes** (`components/auth/ProtectedRoute.tsx`):
  - Guards all authenticated routes
  - Redirects to /login if not authenticated

### 2. Dual-Theme Sidebar
The sidebar supports two themes that match the mockups exactly:

**Light Theme** (default):
- White background (#FFFFFF)
- Blue-600 accents (#2563EB)
- Active state: bg-blue-50, text-blue-700
- Inactive: text-slate-600, hover:bg-slate-50

**Dark Theme**:
- Slate-900 background (#0F172A)
- Indigo-400 accents
- Active state: bg-slate-800, text-indigo-400
- Inactive: text-slate-400, hover:bg-slate-800

Theme persists to localStorage and can be toggled via the button at the bottom of the sidebar.

### 3. Navigation Structure

**Main Section:**
- Dashboard (/)
- User Management (/users)

**Workspace Section:**
- Segments (/segments)
- Companies (/companies)
- Contacts (/contacts)

**Operations Section:**
- Approval Queue (/approvals) - with badge showing 12 pending items

**Bottom Section:**
- Settings (/settings)
- Help & Support (link placeholder)
- Theme Toggle (Light/Dark mode)

### 4. Header Component
- Dynamic page title based on current route
- Notification bell with red indicator dot
- User info section:
  - User name and email
  - Avatar with initials
  - Role badge (purple)
  - Dropdown chevron
- Falls back to default "Admin User" if no user in store

### 5. Login Page
Matches the `01-login-screen.html` design exactly:
- Centered card on #FAFAFA background
- Spanner logo (Wrench icon) in black square
- "Spanner" title + "Internal ABM Platform" subtitle
- Email and password fields
- Remember me checkbox + Forgot password link
- Sign in button (neutral-900)
- IT Support help text at bottom
- Form validation and error handling
- Redirects to / on successful login

## Routing Configuration

```typescript
/login → Login page (public)
/ → Protected → AppShell
  ├── / → Dashboard
  ├── /users → User Management
  ├── /segments → Segments
  ├── /companies → Companies
  ├── /contacts → Contacts
  ├── /approvals → Approval Queue
  └── /settings → Settings
* → Redirect to /
```

## Design System

### Colors
- Primary: #2563EB (blue-600)
- Background: #F8FAFC (slate-50)
- Surface: #FFFFFF
- Border: #E2E8F0 (slate-200)
- Text Primary: #0F172A (slate-900)
- Text Secondary: #64748B (slate-500)

### Typography
- Font: Inter (loaded via Google Fonts)
- Headings: font-semibold to font-bold
- Body: font-medium for emphasis, font-normal otherwise

### Icons
- All icons use Lucide React (NOT Material Symbols)
- Consistent 20px size for nav items
- Proper semantic icons for each section

### Scrollbar
- Custom styled scrollbar matching the mockups
- Width: 8px
- Thumb color: #CBD5E1 (slate-300)
- Hover: #94A3B8 (slate-400)

## State Management

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshAuth: () => Promise<void>;
}
```

### Theme Store
```typescript
interface ThemeState {
  sidebarTheme: 'light' | 'dark';
  toggleSidebarTheme: () => void;
  setSidebarTheme: (theme: 'light' | 'dark') => void;
}
```

## API Integration

### Axios Configuration
- Base URL: `/api/v1`
- Request interceptor: Auto-adds Bearer token from localStorage
- Response interceptor: Auto-redirects to /login on 401
- Timeout: 30 seconds

### Expected API Endpoints
```
POST /api/v1/auth/login
  Request: { email: string, password: string }
  Response: { access_token: string, refresh_token: string, user: User }

GET /api/v1/auth/me
  Response: { user: User }
```

## TypeScript Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'deactivated';
  roles: string[];
  created_at: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
```

## Development

### Running the App
```bash
cd frontend
npm install
npm run dev
```

Server runs on http://localhost:5173

### Building for Production
```bash
npm run build
```

Output in `dist/` directory.

### Linting
```bash
npm run lint
```

## Browser Compatibility
- Modern browsers with ES2020 support
- CSS Grid and Flexbox
- LocalStorage API
- Fetch API

## Next Steps

The app shell is complete. Next implementations should include:

1. **Dashboard Page**: Implement the metrics, charts, and activity feed from `15-app-shell.html`
2. **User Management**: Table view with filtering, search, and CRUD operations
3. **Companies/Contacts**: Implement list view and detail panels
4. **Approval Queue**: Workflow management interface
5. **Settings Page**: User preferences, team settings, etc.
6. **Backend Integration**: Connect to actual API endpoints
7. **Error Boundaries**: Add React error boundaries for graceful error handling
8. **Loading States**: Add skeleton loaders for async operations
9. **User Dropdown**: Implement the header dropdown menu (logout, profile, etc.)
10. **Notifications Panel**: Implement the notifications dropdown

## Notes

- All placeholder pages are simple components with "Coming soon" text
- The sidebar theme toggle is fully functional and persists across sessions
- The login form has basic client-side validation
- Error handling uses react-hot-toast for user feedback
- All navigation uses React Router's NavLink for active state detection
- The design matches the HTML mockups pixel-perfect where applicable
- Lucide React icons are used throughout (not Material Symbols from mockups)
