---
name: create_onboarding_redirection
description: Implement robust onboarding redirection logic using TanStack Start server functions and route guards. Use this skill when building multi-step setup flows that require users to complete specific steps (e.g., profile, subscription) before accessing the main app.
license: MIT
metadata:
  version: '1.0.0'
  author: birthup
---

# Onboarding Redirection Pattern

This skill outlines the standard pattern for handling user onboarding flows, ensuring users are redirected to the correct step based on their status and preventing unauthorized access to the main application until onboarding is complete.

## Core Concepts

1.  **Granular State Functions**: Small, specific server functions to fetch individual pieces of user state (e.g., `getUser`, `getOnboardingStatus`, `getSubscription`).
2.  **Central Redirect Logic**: A single server function (`getOnboardingRedirect`) that orchestrates the state checks and determines the correct URL.
3.  **Route Guards**:
    - **Main App Guard (`/dashboard`)**: kicks incomplete users back to the onboarding entry point (`/onboarding`).
    - **Onboarding Guard (`/onboarding`)**: Redirects users to their specific current step or to the dashboard if already complete.

## 1. Define Granular State Functions

Create a file `src/functions/get-user-details.ts` to house individual state fetchers.

```typescript
// apps/provider/src/functions/get-user-details.ts
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

// 1. Get Basic User/Session
export const getUser = createServerFn().handler(async () => {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: getRequestHeaders() },
  });
  if (!session) return null;
  return session;
});

// 2. Get Feature-Specific Status (e.g., Onboarding)
export const getProviderOnboardingStatus = createServerFn().handler(
  async () => {
    const { data } = await apiFetch('/onboarding/status', {
      headers: getRequestHeaders(),
    });
    return data.status; // e.g., 'PENDING', 'APPROVED'
  },
);

// 3. Get External Service Status (e.g., Stripe)
export const getSubscription = createServerFn().handler(async () => {
  // ... fetch subscription status
  return hasActiveSubscription;
});
```

## 2. Implement Central Redirect Logic

Create `src/functions/onboarding-redirect.ts`. This function defines the **order of operations** for your onboarding flow.

**Rule:** Check conditions in order from "least complete" to "most complete".

```typescript
// apps/provider/src/functions/onboarding-redirect.ts
import { createServerFn } from '@tanstack/react-start';
import {
  getUser,
  getProviderOnboardingStatus,
  getSubscription,
} from './get-user-details';

export const getOnboardingRedirect = createServerFn().handler(async () => {
  // 1. Auth Check (Always first)
  const user = await getUser();
  if (!user) return { url: '/login' };

  // 2. Fetch all necessary state
  // usage of Promise.all is recommended for performance if checks are independent
  const [status, subscription] = await Promise.all([
    getProviderOnboardingStatus(),
    getSubscription(),
  ]);

  // 3. Step-by-Step Checks

  // Step A: Profile Submission
  if (status === 'PENDING') {
    return { url: '/onboarding' }; // Root onboarding page (e.g., profile form)
  }

  // Step B: Payment/Subscription (Only check if they passed Step A)
  // Note: logic implies if status is NOT pending, they submitted profile.
  if (!subscription) {
    return { url: '/onboarding/choose-plan' };
  }

  // Step C: Approval Wait
  if (status === 'PROCESSING') {
    return { url: '/onboarding/wait-for-approval' };
  }

  // Step D: Rejection Handling
  if (status === 'REJECTED') {
    return { url: '/onboarding' }; // Send back to form to fix issues
  }

  // 4. Completion
  // If all checks pass, they are ready for the dashboard
  return { url: '/dashboard' };
});
```

## 3. Implement Route Guards

### A. The Onboarding Router (`/onboarding`)

This route acts as the "traffic cop" for the onboarding flow.

```typescript
// apps/provider/src/routes/onboarding/route.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getOnboardingRedirect } from '@/functions/onboarding-redirect';

export const Route = createFileRoute('/onboarding')({
  component: () => <Outlet />,
  beforeLoad: async ({ location }) => {
    // 1. Ask the central logic where valid users should be
    const decision = await getOnboardingRedirect();

    // 2. Redirect ONLY if the user is not at the correct URL
    // This prevents infinite loops
    if (decision?.url && decision.url !== location.pathname) {
      throw redirect({ to: decision.url });
    }
  },
});
```

### B. The Protected Application (`/dashboard`)

This route ensures no "un-onboarded" users sneak in.

```typescript
// apps/provider/src/routes/dashboard/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  getUser,
  getProviderOnboardingStatus,
} from '@/functions/get-user-details';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    // 1. Basic Auth Check
    const user = await getUser();
    if (!user) throw redirect({ to: '/login' });

    // 2. Completion Check
    // We don't need to re-run specific step checks here.
    // Just check the "final gate" (e.g., is Approved?).
    const status = await getProviderOnboardingStatus();

    if (status !== 'APPROVED') {
      // Kick back to the start of the funnel.
      // The /onboarding route will handle the specific step redirection.
      throw redirect({ to: '/onboarding' });
    }
  },
});
```
