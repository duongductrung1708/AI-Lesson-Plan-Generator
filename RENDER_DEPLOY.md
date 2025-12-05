# Render.com Deployment Guide

## Quick Fix for Build Errors

If you're seeing `find` command errors during deployment, follow these steps:

### Option 1: Configure Root Directory (Recommended)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Settings**
4. Set **Root Directory** to: `backend`
5. Set **Build Command** to: `npm install && npm run build`
6. Set **Start Command** to: `npm start`

This way, Render will only install and build the backend dependencies, avoiding the root-level install issues.

### Option 2: Use render.yaml

If you're using `render.yaml` for infrastructure as code:

1. Make sure `render.yaml` is in your repository root
2. Render will automatically use the configuration from `render.yaml`
3. The build command in `render.yaml` handles the monorepo structure

### Option 3: Manual Build Command

If the above options don't work, set the **Build Command** in Render dashboard to:

```bash
npm install --ignore-scripts || npm install || true; cd backend && npm install && npm run build
```

## Environment Variables

Make sure to set these environment variables in your Render dashboard:

### Required:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string (min 32 characters)
- `JWT_EXPIRE` - Token expiration (e.g., "7d")
- `NODE_ENV` - Set to "production"

### Optional (depending on features used):

- `GEMINI_API_KEY` - For AI lesson plan generation
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GOOGLE_CALLBACK_URL` - OAuth callback URL
- `EMAIL_USER` - For email notifications
- `EMAIL_PASS` - Email password
- `AWS_ACCESS_KEY_ID` - For S3 file storage
- `AWS_SECRET_ACCESS_KEY` - AWS secret
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET_NAME` - S3 bucket name

## Troubleshooting

### Build fails with "find: No such file or directory"

This happens because Render tries to install root dependencies first. Solution:

- Use **Option 1** above (set Root Directory to `backend`)
- Or use the build command from **Option 3**

### Module not found errors

Make sure:

1. Root Directory is set to `backend` (if using Option 1)
2. Build command includes `cd backend && npm install`
3. All dependencies are listed in `backend/package.json`

### Port binding errors

Render automatically sets the `PORT` environment variable. Make sure your backend code uses `process.env.PORT`:

```typescript
const PORT = process.env.PORT || 5000;
```

## Notes

- The `find` command errors are typically non-fatal warnings from dependency postinstall scripts
- Setting Root Directory to `backend` is the cleanest solution
- The `render.yaml` file provides a complete configuration if you prefer infrastructure as code
