# Google OAuth Setup Guide

## Overview

This guide explains how to configure Google OAuth authentication for 1001 Stories platform.

## Prerequisites

- Google Cloud Console project created
- OAuth 2.0 credentials generated
- Access to production server environment variables

## Google Cloud Console Configuration

### Client Credentials

```
Client ID: [Your Google Client ID]
Project ID: [Your Google Project ID]
```

**Note**: Actual credentials are stored securely in environment variables and not committed to git.

### ⚠️ CRITICAL: Redirect URI Configuration

**Current (INCORRECT) Redirect URI:**
```
https://1001stories.seedsofempowerment.org/api/auth/google/login
```

**Required (CORRECT) Redirect URI:**
```
https://1001stories.seedsofempowerment.org/api/auth/callback/google
```

**Action Required:**
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Select project: `smile-auth-475500`
3. Edit OAuth 2.0 Client ID
4. Update "Authorized redirect URIs" to:
   ```
   https://1001stories.seedsofempowerment.org/api/auth/callback/google
   ```
5. Save changes

### Authorized JavaScript Origins

```
https://1001stories.seedsofempowerment.org
```

## Environment Variables Setup

### Production (.env.production on server)

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="[Your Google Client ID from Google Cloud Console]"
GOOGLE_CLIENT_SECRET="[Your Google Client Secret from Google Cloud Console]"
```

### Local Development (.env.local)

```bash
# For local testing (use localhost redirect)
GOOGLE_CLIENT_ID="[Your Google Client ID]"
GOOGLE_CLIENT_SECRET="[Your Google Client Secret]"
NEXTAUTH_URL="http://localhost:3000"
```

**Note:** For local development, you may need to add `http://localhost:3000/api/auth/callback/google` to Google Console redirect URIs.

## Deployment Steps

### 1. Update Server Environment Variables

```bash
# SSH to server
ssh ubuntu@3.128.143.122

# Edit .env.production
cd /home/ubuntu/1001-stories
nano .env.production

# Add Google OAuth credentials:
GOOGLE_CLIENT_ID="[Your Google Client ID]"
GOOGLE_CLIENT_SECRET="[Your Google Client Secret]"

# Save and exit (Ctrl+X, Y, Enter)
exit
```

### 2. Deploy with Docker Image Build

```bash
# From local machine
./scripts/deploy.sh deploy
```

This will:
1. Build Docker image locally
2. Save image as tar.gz
3. Upload to server
4. Clean server cache (mandatory)
5. Load image on server
6. Restart containers
7. Verify deployment

### 3. Verify Deployment

```bash
# Test HTTPS endpoint
curl https://1001stories.seedsofempowerment.org/api/health

# Check if Google button appears
curl https://1001stories.seedsofempowerment.org/login | grep "Sign in with Google"

# Verify containers running
ssh ubuntu@3.128.143.122 "docker ps"
```

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - Frontend: `/app/login/page.tsx` or `/app/signup/page.tsx`
   - Calls: `signIn('google', { callbackUrl: '/dashboard' })`

2. **Redirect to Google OAuth**
   - NextAuth.js redirects to Google login page
   - User authorizes application

3. **Google redirects back with auth code**
   - Redirect URI: `https://1001stories.seedsofempowerment.org/api/auth/callback/google`
   - NextAuth.js exchanges code for tokens

4. **User creation/login**
   - If new user: Create User, Profile, Subscription (role: WRITER)
   - If existing user: Log in with existing account
   - Redirect to `/dashboard/{role}`

### Role Assignment

- **New Google OAuth users**: Automatically assigned `WRITER` role
- **Existing users**: Keep existing role
- **Account linking**: Prevented for security (requires manual linking)

### Security Features

1. **Account Linking Prevention**
   - If email exists with password, Google OAuth blocked
   - Error: "Account Linking Required"
   - User must manually link from profile settings

2. **Session Management**
   - JWT strategy with 30-day expiration
   - Secure HTTP-only cookies
   - CSRF protection enabled

3. **OAuth Token Storage**
   - Access tokens stored in `Account` table
   - Refresh tokens for token renewal
   - Encrypted in database

## Code References

### NextAuth Configuration

File: `/lib/auth.ts` (lines 152-157)

```typescript
...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [{
  id: "google",
  name: "Google",
  type: "oauth",
  ...GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
}] : []),
```

**Activation**: Google OAuth automatically enabled when environment variables are set.

### Frontend Components

**Login Page**: `/app/login/page.tsx` (lines 341-369)
- Google button already implemented
- Calls `handleSocialLogin('google')`

**Signup Page**: `/app/signup/page.tsx` (lines 424-448)
- Google button already implemented
- Calls `handleSocialSignup('google')`

### Database Schema

**User Model**: Optional password field (OAuth users don't need password)

**Account Model**: Stores OAuth tokens
- provider: "google"
- providerAccountId: Google user ID
- access_token: OAuth access token
- refresh_token: OAuth refresh token
- expires_at: Token expiration timestamp

## Troubleshooting

### Issue: "Redirect URI Mismatch"

**Symptom**: Google shows error "redirect_uri_mismatch"

**Solution**:
1. Verify redirect URI in Google Console matches exactly:
   ```
   https://1001stories.seedsofempowerment.org/api/auth/callback/google
   ```
2. No trailing slashes
3. HTTPS (not HTTP) for production

### Issue: "Google Button Not Showing"

**Symptom**: Login/signup pages don't show Google button

**Solution**:
1. Verify environment variables are set:
   ```bash
   ssh ubuntu@3.128.143.122
   cd /home/ubuntu/1001-stories
   cat .env.production | grep GOOGLE
   ```
2. Restart containers:
   ```bash
   docker compose restart app
   ```

### Issue: "Account Linking Required" Error

**Symptom**: User sees error when trying to sign in with Google

**Cause**: Email already registered with password

**Solution**: This is expected behavior for security. User should:
1. Log in with password
2. Go to profile settings
3. Link Google account manually (feature to be implemented)

### Issue: OAuth Tokens Expired

**Symptom**: User logged out unexpectedly

**Solution**:
- Sessions expire after 30 days (configured in lib/auth.ts)
- Users must re-authenticate
- Refresh token mechanism can be implemented for automatic renewal

## Testing Checklist

### Local Testing

- [ ] Add Google credentials to .env.local
- [ ] Start local Docker: `docker-compose -f docker-compose.local.yml up -d`
- [ ] Visit http://localhost:3000/login
- [ ] Verify "Sign in with Google" button appears
- [ ] Click button (will fail with redirect_uri_mismatch unless localhost added to Google Console)

### Production Testing

- [ ] Google Console redirect URI updated
- [ ] Server .env.production updated with credentials
- [ ] Deployment successful
- [ ] Visit https://1001stories.seedsofempowerment.org/login
- [ ] Verify "Sign in with Google" button appears
- [ ] Test signup with new Google account
- [ ] Verify user created with WRITER role
- [ ] Test login with existing Google account
- [ ] Verify session persists (check after browser restart)

## Rollback Procedure

If Google OAuth causes issues:

```bash
# 1. SSH to server
ssh ubuntu@3.128.143.122

# 2. Comment out Google credentials
cd /home/ubuntu/1001-stories
nano .env.production

# Comment out:
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."

# 3. Restart app container
docker compose restart app

# 4. Verify service restored
curl https://1001stories.seedsofempowerment.org/api/health
```

Google OAuth will automatically disable when environment variables are removed.

## Future Enhancements

1. **Manual Account Linking**
   - UI in profile settings
   - Link Google account to existing email account
   - Unlink functionality

2. **Role Selection for OAuth Users**
   - Post-OAuth role selection page
   - Allow choosing LEARNER, TEACHER, WRITER, INSTITUTION

3. **Additional OAuth Providers**
   - Facebook OAuth
   - Apple OAuth
   - Microsoft OAuth

4. **OAuth Token Refresh**
   - Automatic refresh before expiration
   - Seamless user experience

5. **Email Verification for OAuth**
   - Verify email even for OAuth users
   - Send welcome email

## Security Best Practices

1. **Never commit credentials to git**
   - Use .env files (in .gitignore)
   - Use environment variables in production

2. **Rotate secrets regularly**
   - Update GOOGLE_CLIENT_SECRET periodically
   - Update NEXTAUTH_SECRET periodically

3. **Monitor OAuth attempts**
   - Review security logs
   - Alert on suspicious patterns

4. **Implement rate limiting**
   - Limit OAuth attempts per IP
   - Prevent brute force attacks

5. **Use HTTPS only**
   - Never use HTTP for OAuth in production
   - Redirect HTTP to HTTPS

## Support and Resources

- **Google Cloud Console**: https://console.cloud.google.com/
- **NextAuth.js Docs**: https://next-auth.js.org/providers/google
- **OAuth 2.0 Spec**: https://oauth.net/2/

## Changelog

- **2025-11-20**: Initial Google OAuth setup documentation
- **Required Action**: Update Google Console redirect URI

---

**Last Updated**: 2025-11-20
**Status**: Ready for deployment (pending Google Console redirect URI update)
