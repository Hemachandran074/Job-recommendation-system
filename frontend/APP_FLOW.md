# Job Finder App - Navigation Flow

## Current Routing Logic (Fixed)

### 1. App Entry (`app/index.tsx`)
**Shows splash screen for 1 second, then routes based on auth state:**

```
NOT AUTHENTICATED → Welcome Onboarding
↓
AUTHENTICATED + NO PROFILE → Profile Creation
↓  
AUTHENTICATED + HAS PROFILE → Dashboard
```

### 2. Welcome Onboarding Flow
**Path:** `(onboarding)/welcome.tsx`
- **Who sees it:** First-time users (not logged in)
- **Purpose:** Introduce app features
- **Screens:** 3 onboarding slides
  1. "Find your suitable internship now"
  2. "Get the internship to your nearest location"
  3. "Get the opportunities from multiple media"
- **Navigation:** After last slide → Sign In page

### 3. Authentication Flow
**Paths:** `(auth)/signin.tsx` and `(auth)/signup.tsx`

**Sign In:**
- Email + Password
- Social login (Google, Facebook) - UI only
- Link to Sign Up
- On success → Dashboard

**Sign Up:**
- Name, Email, Password, Role (student/employer)
- Link to Sign In
- On success → Profile Creation

### 4. Profile Creation Flow (Onboarding for logged-in users)
**Path:** `(profile)/`
- **Who sees it:** Logged-in users without complete profile
- **Screens:**
  1. `personal.tsx` - Personal info
  2. `skills.tsx` - Skills selection
  3. `education.tsx` - Education details
- **Navigation:** After completion → Dashboard

### 5. Main App (Tabs)
**Path:** `(tabs)/`
- **Who sees it:** Authenticated users with complete profile
- **Screens:**
  - Home/Jobs
  - Explore
  - Profile
  - etc.

## Testing the Onboarding Flow

### To see Welcome Onboarding:
1. Clear app storage (sign out if logged in)
2. Restart app
3. Should see 3 welcome slides
4. Last slide button → Goes to Sign In

### To see Profile Onboarding:
1. Sign up with new account
2. After sign up → Should redirect to Personal Info page
3. Complete: Personal → Skills → Education
4. After completion → Dashboard

### To skip to Dashboard:
1. Sign in with existing account that has complete profile
2. Should go directly to Dashboard

## Troubleshooting

### Problem: Can't see onboarding pages

**Possible causes:**

1. **Already authenticated** - App skips welcome onboarding if you're logged in
   - **Solution:** Sign out first to see welcome onboarding

2. **Profile already complete** - App skips profile onboarding
   - **Solution:** Create new account to see profile onboarding

3. **App not refreshing** - Cached authentication state
   - **Solution:** 
     - Restart Metro bundler: `npx expo start -c`
     - Clear app data on device/emulator
     - Reinstall app

4. **Navigation timing issue** - 1 second timeout might be too fast
   - **Solution:** Increase timeout in `index.tsx`

5. **Running old backend** - MongoDB server instead of PostgreSQL
   - **Solution:** Start new PostgreSQL server on port 8001

### Quick Debug Steps:

```bash
# 1. Check if app is running
cd "c:\chandru\New folder\frontend\jobfinder"
npx expo start

# 2. Clear cache if needed
npx expo start -c

# 3. Check which device you're using
# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Scan QR code for physical device
```

### Check Authentication State:

Add this debug code to `app/index.tsx`:

```typescript
useEffect(() => {
  console.log('Auth State:', { isAuthenticated, hasProfile });
  // ... rest of code
}, [isAuthenticated, hasProfile]);
```

## Current Status

✅ **Fixed Routing Logic:**
- Not authenticated → Welcome onboarding
- Authenticated without profile → Profile creation
- Authenticated with profile → Dashboard

✅ **Welcome Onboarding:** 3 slides with navigation
✅ **Profile Onboarding:** Personal, Skills, Education pages
✅ **Authentication:** Sign in/Sign up pages working

❓ **Need to verify:**
- Metro bundler running?
- Which device/emulator being used?
- Current authentication state?
