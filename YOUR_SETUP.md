# 📖 YOUR PERSONAL SETUP GUIDE - Tetra Netflix

Hello! Follow these exact steps in order. Everything is ready to go!

## Step 1: Verify Everything is Installed ✅

Open terminal and run:

```bash
node -v
npm -v
```

You should see version numbers (e.g., `v18.0.0`). If not, install Node.js from nodejs.org.

## Step 2: Navigate to Project Folder

```bash
cd "c:\Users\dshar\OneDrive\Documents\VSCode\Web_projects\tetra_netflix"
```

Or use VS Code's terminal (Terminal → New Terminal).

## Step 3: Install Dependencies (If Not Already Done)

```bash
npm install
```

This will take 1-2 minutes. Wait for it to finish.

## Step 4: Get Your Gmail Credentials

You have two options:

### Option A: You Already Have Credentials ✅
Skip to Step 5.

### Option B: You Need to Get Credentials (First Time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** → Name it "Tetra Netflix"
3. Search for **Gmail API** → Click **Enable**
4. Go to **Credentials** (left menu)
5. Click **Create Credentials** → **OAuth Client ID**
6. Choose **Desktop Application**
7. Click **Create**
8. Click **Download** (JSON file)
9. Open the JSON file with text editor
10. Copy these values:
    - `client_id`
    - `client_secret`

Now you have: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Get Refresh Token

Run this command:

```bash
# This will open a browser window
node -e "
const { google } = require('googleapis');
const CLIENT_ID = 'your_client_id_here';
const CLIENT_SECRET = 'your_client_secret_here';
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000');
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });
console.log('Visit this URL:', url);
"
```

Replace `your_client_id_here` and `your_client_secret_here` with your actual values.

This will:
1. Print a URL
2. Open it in browser
3. Ask for Gmail permission
4. Show a code
5. Copy that code
6. Run:
```bash
# (continue from previous command output)
# The code will be displayed after you authorize
```

Once you have the `GMAIL_REFRESH_TOKEN`, save it!

## Step 5: Create `.env.local` File

In the project folder, create a new file called `.env.local` (note the dot at start).

Add these lines (replace xxx with your actual values):

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GMAIL_REFRESH_TOKEN=xxx
GMAIL_USER=me
NODE_ENV=development
```

**Example:**
```
GOOGLE_CLIENT_ID=644147139279-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRs
GMAIL_REFRESH_TOKEN=ya29.a0AaB1Cd2EfGhIjKlMnOpQrStUvWxYz
GMAIL_USER=me
NODE_ENV=development
```

**Save the file!**

## Step 6: Start the App

```bash
npm run dev
```

You should see:
```
> tetra_netflix@0.1.0 dev
> next dev

   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000
```

✅ **The app is running!**

## Step 7: Open in Browser

Open your web browser and go to:

```
http://localhost:3000
```

You should see a pink Netflix-themed form.

## Step 8: Test It!

1. **Enter your Gmail address** (the one you configured)
2. **Click "Fetch Now"**
3. **Wait 3-10 seconds**

### If You See a Big Number ✅
- That's your Netflix code!
- Click **"Copy Code"** to copy it
- Use it on your Netflix TV device

### If You See a Purple Box ✅
- That's a household location update link!
- Click **"🟢 Approve Update"** to open it
- Click the verification button on Netflix

### If You See an Error ❌
- Check the error message
- See "Troubleshooting" below

## 🆘 Troubleshooting

### Problem: "Please enter your email address"
- You didn't type anything
- Type your Gmail address

### Problem: "Please enter a valid email address"
- Your email format is wrong
- Format should be: `name@gmail.com` or `name@domain.com`

### Problem: "No Netflix code or household update link found"
**This is the most common issue!**

Steps to fix:
1. Check your Gmail inbox for Netflix emails
   - If none: Open Netflix on TV, request a code/household update
   - Wait 2-5 minutes for the email to arrive
2. Make sure your `.env.local` has the RIGHT email/credentials
3. Try again

### Problem: Dev server won't start
```bash
# Kill any running process on port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
# Windows: press Ctrl+C in terminal, then try again
```

### Problem: Page shows "Searching..." forever (>30 seconds)
1. Press F12 to open browser console
2. Look for error messages (red text)
3. If you see "Failed to load email service":
   - Your `.env.local` credentials are wrong
   - Double-check them
   - Restart dev server: `npm run dev`

### Problem: "Failed to load email service"
1. Check that `.env.local` file exists in project root
2. Check that all 3 credentials are filled in (not empty)
3. Make sure there are no extra spaces or typos
4. Restart: `npm run dev`

## 🎯 What to Do Next

Once it's working:

### Test Everything
- [ ] Enter valid email → Works ✅
- [ ] Enter invalid email → Error message shows ✅
- [ ] Click "Copy Code" → Code appears in clipboard ✅
- [ ] Click "Approve Update" → Netflix link opens ✅

### Deploy (Optional)
If you want to share this with friends/family:

**Easy Option - Vercel:**
```bash
npm install -g vercel
vercel
```

Follow the prompts. It will:
1. Ask to create Vercel account (free)
2. Deploy your code
3. Give you a live URL
4. Ask for environment variables → Enter your `.env` values

**Done!** Your app is live on the internet! 🎉

## 📝 Important Notes

### Security ⚠️
- **NEVER** share your `.env.local` file
- **NEVER** commit it to GitHub
- **NEVER** show your refresh token to anyone
- Add `.env.local` to `.gitignore` to be safe

### Privacy 🔒
- Your emails are NOT saved or sent anywhere
- Only the code/link is extracted
- Everything is encrypted via Gmail API

### Usage 💡
- Works with Gmail accounts only
- Searches your inbox for Netflix emails
- Requires Gmail OAuth permission (you control it)

## 🎓 Understanding the Code

### What Each Part Does:

**`app/page.tsx`** - The website you see
- Shows the form
- Displays code in big bold text
- Shows "Approve Update" button
- Handles copy/open button clicks

**`app/api/fetch-code/route.ts`** - The server
- Receives your email
- Checks if it's valid
- Calls Gmail API
- Returns code or link

**`lib/gmail.ts`** - Gmail integration
- Connects to your Gmail
- Searches for Netflix emails
- Extracts codes (numbers)
- Extracts links (URLs)

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Project folder open
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with credentials
- [ ] Dev server running (`npm run dev`)
- [ ] Website opens at http://localhost:3000
- [ ] Form loads without errors
- [ ] Entered email and clicked "Fetch Now"
- [ ] Saw result (code or link or error)
- [ ] If error, fixed it
- [ ] If code: Clicked "Copy Code" ✅
- [ ] If link: Clicked "Approve Update" ✅

## 🎉 You're Done!

Congratulations! Your Tetra Netflix app is fully working! 🎊

### What You Can Do Now:
1. Use it to fetch Netflix codes & household update links
2. Share it with friends/family (after deploying)
3. Customize it (change colors, add features)
4. Learn Next.js by reading the code
5. Deploy to production

### Need Help?
- Check `SETUP_GUIDE.md` for detailed info
- Check `QUICK_START.md` for quick reference
- Check browser console (F12) for error messages
- Read the code comments

---

**Your project is 100% ready to use!** 🚀

**Enjoy!** ✨

(Made with ❤️ - Last Updated: November 2025)
