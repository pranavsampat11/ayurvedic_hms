# 🚀 Deployment Guide for Ayurvedic HMS

## Prerequisites
- GitHub account
- Vercel account
- Supabase project set up

## Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub repository**:
   - Go to GitHub.com
   - Create a new repository named `ayurvedic-hms`
   - Don't initialize with README (since you already have files)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ayurvedic-hms.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**:
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to your project
   - Go to Settings → Environment Variables
   - Add these variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://yzmqdruerraecaoblrwv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project-name.vercel.app`

## Step 3: Configure Supabase for Production

1. **Update Supabase Settings**:
   - Go to your Supabase dashboard
   - Go to Settings → API
   - Copy your "anon public" key
   - Add it to Vercel environment variables

2. **Configure CORS** (if needed):
   - In Supabase dashboard
   - Go to Settings → API
   - Add your Vercel domain to allowed origins

## Step 4: Test Your Deployment

1. **Visit your live URL**
2. **Test all major features**:
   - Login with different roles
   - Create/view patients
   - Test IPD/OPD workflows
   - Check data persistence

## Troubleshooting

### Common Issues:

1. **Build Errors**:
   - Check Vercel build logs
   - Ensure all dependencies are in package.json
   - Fix any TypeScript errors

2. **Environment Variables**:
   - Double-check all env vars are set in Vercel
   - Restart deployment after adding env vars

3. **Supabase Connection**:
   - Verify URL and keys are correct
   - Check Supabase project is active
   - Ensure RLS policies allow access

### Performance Tips:

1. **Enable Vercel Analytics** (optional)
2. **Configure custom domain** (optional)
3. **Set up monitoring** (optional)

## Your Live App

Once deployed, your Ayurvedic HMS will be available at:
`https://your-project-name.vercel.app`

Share this URL with your team to access the live application!
