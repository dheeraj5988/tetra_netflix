const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const DB_PATH = path.join(process.cwd(), 'data', 'email-accounts.json');

async function addEmailAccount() {
  console.log('\n📧 Add Email Account to Database\n');
  console.log('This script will help you add an email account for OTP fetching.\n');

  // Read existing database
  let db = { accounts: [] };
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(data);
  } else {
    // Create directory if it doesn't exist
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Get email
  const email = await question('Enter email address: ');
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    rl.close();
    process.exit(1);
  }

  // Check if email already exists
  const exists = db.accounts.some(
    (acc) => acc.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    console.log('⚠️  This email already exists in the database.');
    const overwrite = await question('Do you want to update it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      process.exit(0);
    }
    // Remove existing
    db.accounts = db.accounts.filter(
      (acc) => acc.email.toLowerCase() !== email.toLowerCase()
    );
  }

  // Get password (app password)
  const password = await question('Enter app password (16 chars for Gmail): ');
  if (!password) {
    console.error('❌ Password is required');
    rl.close();
    process.exit(1);
  }

  // Remove spaces from password
  const cleanPassword = password.replace(/\s/g, '');

  // Detect provider
  let provider = 'custom';
  let imapConfig = {
    host: '',
    port: 993,
    secure: true,
  };

  if (email.includes('@gmail.com')) {
    provider = 'gmail';
    imapConfig.host = 'imap.gmail.com';
  } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
    provider = 'outlook';
    imapConfig.host = 'outlook.office365.com';
  } else if (email.includes('@yahoo.com')) {
    provider = 'yahoo';
    imapConfig.host = 'imap.mail.yahoo.com';
  } else {
    // Custom domain - ask for IMAP host
    console.log('\n📋 Custom email domain detected.');
    const customHost = await question('Enter IMAP host (e.g., imap.gmail.com): ');
    if (!customHost) {
      console.error('❌ IMAP host is required');
      rl.close();
      process.exit(1);
    }
    imapConfig.host = customHost;
  }

  // Create account object
  const account = {
    email: email.trim(),
    password: cleanPassword,
    provider,
    imap: imapConfig,
    enabled: true,
  };

  // Add to database
  db.accounts.push(account);

  // Save to file
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log('\n✅ Email account added successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 Account Details:\n');
  console.log(`Email: ${account.email}`);
  console.log(`Provider: ${account.provider}`);
  console.log(`IMAP Host: ${account.imap.host}`);
  console.log(`IMAP Port: ${account.imap.port}`);
  console.log(`Enabled: ${account.enabled}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 You can now use this email in the app!\n');

  rl.close();
}

addEmailAccount().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
