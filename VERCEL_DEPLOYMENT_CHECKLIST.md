# Vercel Deployment Checklist

## Pre-Deployment (Critical - Do These First)

### 1. Environment Variables Setup
- [ ] Copy all `.env.local` variables to Vercel project settings
- [ ] Update `NEXT_PUBLIC_URL` to your Vercel domain
- [ ] Update `NEXTAUTH_URL` to your Vercel domain
- [ ] Verify `DATABASE_URL` points to production database
- [ ] Test database connection locally with production URL

### 2. Database Preparation
- [ ] Run Prisma migrations on production database:
  ```bash
  npx prisma db push --accept-data-loss
  ```
- [ ] Generate Prisma client for production:
  ```bash
  npx prisma generate
  ```
- [ ] Verify database schema matches your Prisma schema

### 3. Supabase Configuration
- [ ] Add Vercel domain to Supabase allowed origins
- [ ] Update redirect URLs in Supabase Auth settings
- [ ] Test Supabase connection with production keys

## Deployment Process

### 4. Build Testing
- [ ] Run local production build:
  ```bash
  npm run build
  npm start
  ```
- [ ] Run comprehensive tests [[memory:3770012238175450987]]:
  ```bash
  npm test
  npm run test:coverage
  npm run test:auth
  ```
- [ ] Verify all API routes work locally

### 5. Vercel Deploy
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Deploy to preview environment first
- [ ] Test preview deployment thoroughly

## Post-Deployment Verification

### 6. Functionality Testing
- [ ] Test user registration/login flow
- [ ] Verify survey form submission works
- [ ] Test formula calculation endpoints
- [ ] Check HIPAA compliance features
- [ ] Verify intake format handling (legacy + numeric) [[memory:393367675102686514]]

### 7. Performance & Security
- [ ] Check Core Web Vitals in Vercel Analytics
- [ ] Verify security headers are applied
- [ ] Test API rate limiting
- [ ] Monitor error rates in first 24 hours

## Rollback Plan

### 8. Emergency Procedures
- [ ] Keep previous working deployment accessible
- [ ] Document how to revert environment variables
- [ ] Have database backup ready
- [ ] Know how to switch DNS if needed

## Environment-Specific Notes

- **Development**: Uses `npm run dev --turbopack`
- **Production**: Uses optimized build with security headers
- **Testing**: Comprehensive test suite must pass before deploy

## Common Issues & Solutions

1. **Build Fails**: Check for TypeScript errors and missing dependencies
2. **API Routes 500**: Verify environment variables and database connections
3. **Auth Issues**: Check Supabase configuration and redirect URLs
4. **Database Errors**: Ensure migrations ran and connection string is correct 