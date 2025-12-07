# 📧 IMAP Email Setup Guide - Tetra Netflix

This guide will help you set up email accounts for OTP fetching using IMAP (Gmail, Outlook, etc.).

## 🎯 Overview

The system now uses IMAP to fetch emails directly from your email provider. You need to:
1. Add email accounts to the database
2. Get app passwords for each email
3. Configure IMAP settings

---

## 📋 Step-by-Step Manual Setup

### Step 1: Create Email Database File

The database file is located at: `data/email-accounts.json`

If it doesn't exist, it will be created automatically. The structure is:

```json
{
  "accounts": [
    {
      "email": "your-email@gmail.com",
      "password": "your-app-password",
      "provider": "gmail",
      "imap": {
        "host": "imap.gmail.com",
        "port": 993,
        "secure": true
      },
      "enabled": true
    }
  ]
}
```

---

### Step 2: Get App Password for Gmail

#### For Gmail:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter name: "Tetra Netflix"
   - Click "Generate"
   - **Copy the 16-character password** (no spaces)

3. **Add to Database**:
   - Open `data/email-accounts.json`
   - Add your email with the app password:

```json
{
  "email": "dsharma259889+july@gmail.com",
  "password": "abcd efgh ijkl mnop",
  "provider": "gmail",
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true
  },
  "enabled": true
}
```

**Important**: Remove spaces from the app password when adding to JSON!

---

### Step 3: Get App Password for Outlook

#### For Outlook/Office 365:

1. **Enable 2-Step Verification**:
   - Go to: https://account.microsoft.com/security
   - Enable "Two-step verification"

2. **Generate App Password**:
   - Go to: https://account.microsoft.com/security/app-passwords
   - Click "Create a new app password"
   - Enter name: "Tetra Netflix"
   - Click "Generate"
   - **Copy the password**

3. **Add to Database**:

```json
{
  "email": "your-email@outlook.com",
  "password": "your-app-password-here",
  "provider": "outlook",
  "imap": {
    "host": "outlook.office365.com",
    "port": 993,
    "secure": true
  },
  "enabled": true
}
```

---

### Step 4: Enable IMAP (If Required)

#### Gmail:
1. Go to: https://mail.google.com/mail/u/0/#settings/fwdandpop
2. Enable "Enable IMAP"
3. Click "Save Changes"

#### Outlook:
- IMAP is enabled by default for Office 365 accounts

---

### Step 5: Test Your Setup

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open the app**: http://localhost:3000

3. **Enter your email** (must match exactly what's in the database)

4. **Click "Fetch Now"**

5. **Check the result**:
   - ✅ Code found? Success!
   - ❌ Error? Check the troubleshooting section below

---

## 🔧 IMAP Configuration for Different Providers

### Gmail
```json
{
  "host": "imap.gmail.com",
  "port": 993,
  "secure": true
}
```

### Outlook/Office 365
```json
{
  "host": "outlook.office365.com",
  "port": 993,
  "secure": true
}
```

### Yahoo Mail
```json
{
  "host": "imap.mail.yahoo.com",
  "port": 993,
  "secure": true
}
```

### Custom Domain (Gmail)
```json
{
  "host": "imap.gmail.com",
  "port": 993,
  "secure": true
}
```

### Custom Domain (Outlook)
```json
{
  "host": "outlook.office365.com",
  "port": 993,
  "secure": true
}
```

---

## 📝 Example Database File

Here's a complete example with multiple accounts:

```json
{
  "accounts": [
    {
      "email": "dsharma259889+july@gmail.com",
      "password": "abcdefghijklmnop",
      "provider": "gmail",
      "imap": {
        "host": "imap.gmail.com",
        "port": 993,
        "secure": true
      },
      "enabled": true
    },
    {
      "email": "your-email@outlook.com",
      "password": "your-outlook-app-password",
      "provider": "outlook",
      "imap": {
        "host": "outlook.office365.com",
        "port": 993,
        "secure": true
      },
      "enabled": true
    }
  ]
}
```

---

## 🆘 Troubleshooting

### Error: "This email address is not registered"
- **Solution**: Add the email to `data/email-accounts.json`
- Make sure the email matches exactly (case-insensitive)

### Error: "Failed to fetch emails: Invalid credentials"
- **Solution**: 
  1. Check that your app password is correct
  2. Make sure you removed spaces from the app password
  3. Regenerate the app password if needed

### Error: "Connection timeout"
- **Solution**:
  1. Check your internet connection
  2. Verify IMAP is enabled for your email
  3. Check firewall settings

### Error: "No Netflix code found"
- **Solution**:
  1. Make sure you have Netflix emails in your inbox
  2. Request a new code from Netflix
  3. Wait 2-5 minutes for email to arrive
  4. Check spam folder

### Gmail: "Less secure app access"
- **Solution**: 
  - Gmail no longer supports "less secure apps"
  - You MUST use an App Password (see Step 2)
  - Enable 2-Step Verification first

---

## 🔒 Security Notes

1. **Never commit `data/email-accounts.json` to Git**
   - It's already in `.gitignore`
   - Contains sensitive passwords

2. **Use App Passwords, not regular passwords**
   - More secure
   - Can be revoked individually
   - Required for 2FA accounts

3. **Keep the database file secure**
   - Only accessible to authorized users
   - Store in a secure location

---

## ✅ Quick Checklist

- [ ] Created `data/email-accounts.json` file
- [ ] Enabled 2-Step Verification on email account
- [ ] Generated App Password
- [ ] Added email to database with correct IMAP settings
- [ ] Enabled IMAP in email settings (if required)
- [ ] Tested with `npm run dev`
- [ ] Successfully fetched OTP code

---

## 🎉 You're Done!

Once you've added your email accounts and tested successfully, the system will automatically:
- Check if email exists in database
- Connect via IMAP
- Search for Netflix codes
- Return the OTP or household link

**No more OAuth tokens needed!** 🚀
