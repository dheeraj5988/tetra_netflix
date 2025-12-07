# Tetra Netflix - OTP & Household Update Link Fetcher

A Next.js application that automatically fetches Netflix OTP codes and household update links from your email inbox using IMAP.

## Features

- 🔐 **IMAP Email Integration**: Supports Gmail, Outlook, and other IMAP-compatible email providers
- 📧 **Automatic OTP Extraction**: Fetches Netflix sign-in codes from your email
- 🔗 **Household Update Links**: Extracts Netflix account update links from emails
- 🚀 **Fast & Reliable**: Direct email fetching without search timeouts
- 🔒 **Secure**: Email credentials stored locally in JSON database

## Prerequisites

- Node.js 18+ and npm
- An email account with IMAP enabled
- App password for your email provider (for Gmail/Outlook)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Account

Add your email account to the database:

```bash
npm run add-email
```

Or manually edit `data/email-accounts.json`:

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

### 3. Generate App Password

**For Gmail:**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password
4. Use it in the email database

**For Outlook:**
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Advanced security options → App passwords
3. Generate a new app password
4. Use it in the email database

See `IMAP_SETUP_GUIDE.md` for detailed instructions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your email address in the input field
2. Click "Fetch Code" or "Fetch Link"
3. The system will:
   - Verify the email exists in the database
   - Connect to your email via IMAP
   - Fetch the last 10 emails
   - Extract Netflix codes or household update links
   - Display the result

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run add-email` - Add email account to database
- `npm run test-simple` - Test IMAP connection and fetch top 5 emails
- `npm run test-emails` - Test email fetching functionality

## Project Structure

```
tetra_netflix/
├── app/
│   ├── api/fetch-code/    # API endpoint for fetching codes/links
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── lib/
│   ├── email-db.ts         # Email database management
│   ├── imap-email.ts       # IMAP email fetching logic
│   └── gmail.ts            # Legacy Gmail OAuth (deprecated)
├── scripts/
│   ├── add-email-account.js # Add email to database
│   ├── test-simple-fetch.js # Test IMAP connection
│   └── test-email-fetch.js  # Test email fetching
├── data/
│   └── email-accounts.json  # Email credentials (gitignored)
└── IMAP_SETUP_GUIDE.md     # Detailed setup instructions
```

## How It Works

1. **Email Validation**: Checks if the entered email exists in the database
2. **IMAP Connection**: Connects to the email provider's IMAP server
3. **Direct Fetch**: Fetches the last 10 emails by sequence number (no search, avoids timeouts)
4. **Email Processing**: Parses emails and filters for Netflix emails
5. **Code/Link Extraction**: Uses regex patterns to extract OTP codes or household update links
6. **Result Display**: Shows the extracted code or link to the user

## Security Notes

- ⚠️ **Never commit `data/email-accounts.json`** - It contains sensitive passwords
- ⚠️ **Never commit `.env.local`** - Contains environment variables
- ✅ Both files are already in `.gitignore`
- ✅ Use app passwords, not your main email password
- ✅ Keep your email database file secure

## Troubleshooting

### "Email not found in database"
- Add your email using `npm run add-email`
- Or manually edit `data/email-accounts.json`

### "Connection timeout"
- Check your internet connection
- Verify IMAP settings in `email-accounts.json`
- Ensure app password is correct

### "No Netflix code found"
- Make sure you have recent Netflix emails in your inbox
- Check that emails are from `netflix.com` domain
- Try sending a new OTP to your email

### Test IMAP Connection
```bash
npm run test-simple
```

This will fetch and display the top 5 emails from your account.

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **imap-simple** - IMAP client library
- **mailparser** - Email parsing
- **Tailwind CSS** - Styling

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
