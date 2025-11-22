# Tetra Netflix - Quick Start Checklist

## ✅ Setup Checklist (Do this first)

- [ ] **Node.js installed?** Run `node -v` (need v16+)
- [ ] **Project cloned?** `git clone https://github.com/dheeraj5988/tetra_netflix.git && cd tetra_netflix`
- [ ] **Dependencies installed?** `npm install`
- [ ] **Google OAuth setup?** 
  - [ ] Created Google Cloud Project
  - [ ] Enabled Gmail API
  - [ ] Downloaded OAuth credentials (client_id, client_secret)
- [ ] **Got refresh token?** Run `npm run get-token` (or use existing one)
- [ ] **`.env.local` created** with:
  ```
  GOOGLE_CLIENT_ID=xxx
  GOOGLE_CLIENT_SECRET=xxx
  GMAIL_REFRESH_TOKEN=xxx
  GMAIL_USER=me
  NODE_ENV=development
  ```

## 🚀 Running Checklist

- [ ] **Start dev server:** `npm run dev`
- [ ] **Open browser:** http://localhost:3000
- [ ] **Enter your Gmail address**
- [ ] **Click "Fetch Now"**
- [ ] **Check result:**
  - [ ] Code displayed? ✅ Copy it & use on Netflix TV
  - [ ] Link displayed? ✅ Click "Approve Update"
  - [ ] Error? 👇 See troubleshooting below

## 🆘 If It Doesn't Work

### ❌ "Email address is required"
- You didn't enter an email
- Fix: Type your Gmail address

### ❌ "Invalid email format"
- Email format is wrong (e.g., "user@" instead of "user@gmail.com")
- Fix: Check spelling and format

### ❌ "No Netflix code or link found"
- No Netflix emails in your Gmail inbox yet
- Fix:
  1. Check your Gmail inbox for Netflix emails
  2. Verify credentials in `.env.local`
  3. Try requesting a new Netflix code/household update
  4. Wait 2-5 minutes for Gmail to sync

### ❌ "Failed to load email service"
- Credentials not configured correctly
- Fix:
  1. Delete `.env.local`
  2. Regenerate credentials: `npm run get-token`
  3. Create new `.env.local` with correct values
  4. Restart dev server: `npm run dev`

### ❌ Page shows "Searching..." forever
- API call is hanging
- Fix:
  1. Open browser console (F12)
  2. Check for error messages
  3. Look at network tab (should see POST to `/api/fetch-code`)
  4. If stuck, restart server: `npm run dev`

### ❌ Dev server won't start
- Fix:
  ```bash
  # Kill any existing process on port 3000
  lsof -ti:3000 | xargs kill -9  # Mac/Linux
  netstat -ano | findstr :3000   # Windows (find PID, then taskkill /PID xxx)
  
  # Then try again
  npm run dev
  ```

## 📱 Testing the App

### Test 1: UI Loads
- [ ] Go to http://localhost:3000
- [ ] See form with email input ✅

### Test 2: Email Validation
- [ ] Enter "invalid" → should say "Invalid email format" ✅
- [ ] Leave blank → should say "Please enter your email" ✅

### Test 3: Real Gmail Lookup
- [ ] Enter your Gmail address
- [ ] Click "Fetch Now"
- [ ] Wait 5-10 seconds
- [ ] Check result:
  - Code box (green) with large number → ✅ WORKS
  - Link box (purple) with URL → ✅ WORKS
  - Error message → 👇 Go to troubleshooting

### Test 4: Copy Code
- [ ] If you got a code, click "Copy Code"
- [ ] Try pasting somewhere (Ctrl+V) → ✅ WORKS

### Test 5: Approve Link
- [ ] If you got a link, click "🟢 Approve Update"
- [ ] New browser tab opens with Netflix verification → ✅ WORKS

## 📊 How to Know It's Working

✅ **Success indicators:**
- Page loads without errors
- Email validation works (rejects bad emails)
- "Searching..." appears for 2-10 seconds
- Result displays (code or link found)
- Copy/Approve buttons work

❌ **Problem indicators:**
- Page shows white screen
- "Searching..." stays forever (>30 seconds)
- Error messages don't make sense
- No response from API

## 🎓 What Each File Does

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main UI (form, code display, link button) |
| `app/api/fetch-code/route.ts` | Backend API (handles requests) |
| `lib/gmail.ts` | Gmail integration (searches emails) |
| `.env.local` | Your secret credentials |
| `package.json` | Project dependencies & scripts |

## 🔄 Common Workflow

```
1. Request Netflix code/household update on TV
2. Open Tetra Netflix website
3. Enter your Gmail
4. Click "Fetch Now"
5. Copy code OR click approve link
6. Use on Netflix device
7. Done! ✅
```

## 📞 Need Help?

1. **Check this checklist** - Most issues are covered
2. **Check SETUP_GUIDE.md** - Detailed troubleshooting
3. **Look at browser console** (F12) - Shows JavaScript errors
4. **Check Network tab** (F12) - Shows API response
5. **Open GitHub issues** - Report bugs

## 🎯 Next Steps After It Works

- [ ] Deploy to Vercel/Heroku/Docker
- [ ] Set up GitHub Actions CI/CD
- [ ] Add more features (SMS notification, auto-approve, etc.)
- [ ] Share with friends & family
- [ ] Star ⭐ the repo if you like it

---

**Version:** 1.0  
**Last Updated:** November 2025  
**Status:** ✅ Fully Functional
