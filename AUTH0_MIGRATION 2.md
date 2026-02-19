# Auth0 Integration - Migration Guide

## Overview
Auth0 authentication has been added to the frontend. This guide covers the changes and how to update existing code.

## Prerequisites

### 1. Install Dependencies
```bash
cd frontend
pnpm add @auth0/auth0-react
```

### 2. Environment Variables
Copy `frontend/.env.example` to `frontend/.env` and configure:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience
```

## What Was Changed

### New Files Created

1. **`frontend/src/components/AuthGuard.tsx`**
   - Protects routes requiring authentication
   - Shows loading state during auth check
   - Redirects to login if not authenticated

2. **`frontend/src/contexts/ApiClientContext.tsx`**
   - Provides authenticated API client via React context
   - Automatically includes Bearer token in requests
   - Export `useApi()` hook for consuming the client

3. **`frontend/src/contexts/StorageContext.tsx`**
   - Provides user-scoped localStorage
   - Automatically namespaces storage keys by user ID
   - Export `useStorage()` hook

4. **`frontend/src/hooks/useApi.ts`**
   - Re-exports `useApi` hook for easier imports

5. **`frontend/src/hooks/useStorage.ts`**
   - Re-exports `useStorage` hook for easier imports

### Modified Files

1. **`frontend/src/config/env.ts`**
   - Added Auth0 configuration variables

2. **`frontend/src/main.tsx`**
   - Wrapped app with `Auth0Provider`

3. **`frontend/src/lib/apiClient.ts`**
   - Added optional `getAccessToken` parameter
   - Automatically adds `Authorization` header when token getter provided

4. **`frontend/src/layouts/AppLayout.tsx`**
   - Wrapped with `AuthGuard`
   - Added `ApiClientProvider`
   - Added `StorageProvider`

5. **`frontend/src/components/NavBar.tsx`**
   - Added user profile display
   - Added logout button

6. **`frontend/src/storage/sessionPointer.ts`**
   - Added optional `userId` parameter for user-scoped storage

## Migration Steps for Existing Code

### Step 1: Replace API Client Usage

**Before:**
```typescript
import { api } from "@/services/api";

// In component
const sessions = await api.listSessions();
```

**After:**
```typescript
import { useApi } from "@/hooks/useApi";

// In component
function MyComponent() {
  const api = useApi();

  // Use TanStack Query
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.listSessions(),
  });
}
```

### Step 2: Replace Storage Usage

**Before:**
```typescript
import { storage } from "@/services/storage";

// In component
const sessionId = await storage.loadLastSessionId();
```

**After:**
```typescript
import { useStorage } from "@/hooks/useStorage";

// In component
function MyComponent() {
  const storage = useStorage();

  useEffect(() => {
    storage.loadLastSessionId().then(setSessionId);
  }, [storage]);
}
```

### Step 3: Update Files Using Old API/Storage

Files that need updating:
- `frontend/src/routes/home/HomePage.tsx`
- `frontend/src/services/sessions.ts`

For each file:
1. Replace `import { api } from "@/services/api"` with `import { useApi } from "@/hooks/useApi"`
2. Replace `import { storage } from "@/services/storage"` with `import { useStorage } from "@/hooks/useStorage"`
3. Convert function to component or move logic into React hooks
4. Use `const api = useApi()` and `const storage = useStorage()` inside component

## Auth0 Setup

### 1. Create Auth0 Application
1. Go to Auth0 Dashboard
2. Create a new "Single Page Application"
3. Note the Domain and Client ID

### 2. Configure Allowed URLs
- **Allowed Callback URLs**: `http://localhost:5173, https://your-production-domain.com`
- **Allowed Logout URLs**: `http://localhost:5173, https://your-production-domain.com`
- **Allowed Web Origins**: `http://localhost:5173, https://your-production-domain.com`

### 3. Create API in Auth0
1. Go to Applications > APIs
2. Create a new API
3. Set identifier (this is your `VITE_AUTH0_AUDIENCE`)
4. Enable RBAC if needed

### 4. Backend Configuration
The backend must validate JWT tokens from Auth0. Update backend to:
- Verify JWT signature
- Check audience matches
- Extract user ID from `sub` claim

## Testing

### 1. Test Authentication Flow
```bash
cd frontend
pnpm dev
```

- Visit http://localhost:5173
- Should redirect to Auth0 login
- After login, should return to app
- NavBar should show user info

### 2. Test API Calls
- Open browser DevTools > Network
- Make API call (e.g., list sessions)
- Check request headers include `Authorization: Bearer <token>`

### 3. Test Logout
- Click logout button
- Should redirect to Auth0 logout
- Should return to app and redirect to login

## User-Scoped Storage

Storage is now automatically scoped per user. Each user's data is isolated:

```typescript
// User A (sub: "auth0|123")
// Keys: olivia_pm:user:auth0|123:lastScenarioId
//       olivia_pm:user:auth0|123:session:last:scenario-1

// User B (sub: "auth0|456")
// Keys: olivia_pm:user:auth0|456:lastScenarioId
//       olivia_pm:user:auth0|456:session:last:scenario-1
```

No code changes needed - this happens automatically via `StorageProvider`.

## Troubleshooting

### "useApi must be used within ApiClientProvider"
- Make sure component is rendered inside `AppLayout` or wrap with providers

### "Failed to get access token"
- Check Auth0 configuration
- Verify `VITE_AUTH0_AUDIENCE` matches API identifier
- Check browser console for Auth0 errors

### Token not included in requests
- Verify `ApiClientProvider` is used
- Check that `useApi()` hook is called inside component
- Confirm `getAccessTokenSilently` is working

### Storage not user-scoped
- Verify `StorageProvider` is in component tree
- Check `user.sub` is available
- Use `useStorage()` hook instead of direct import

## Next Steps

After completing migration:
1. Update all files using old `api` and `storage` imports
2. Test all user flows (login, logout, API calls, storage)
3. Configure production Auth0 application
4. Update backend to validate JWT tokens
5. Deploy with environment variables configured
