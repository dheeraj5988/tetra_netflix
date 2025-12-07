const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  
  return { env, envPath };
}

function writeEnvFile(envPath, env) {
  const lines = [
    `GOOGLE_CLIENT_ID=${env.GOOGLE_CLIENT_ID || ''}`,
    `GOOGLE_CLIENT_SECRET=${env.GOOGLE_CLIENT_SECRET || ''}`,
    `GMAIL_REFRESH_TOKEN=${env.GMAIL_REFRESH_TOKEN || ''}`,
    `GMAIL_USER=${env.GMAIL_USER || 'me'}`,
    `NODE_ENV=${env.NODE_ENV || 'development'}`,
  ];
  
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

async function getRefreshToken() {
  console.log('\n🔐 Gmail Refresh Token Generator\n');
  console.log('This script will help you get a new refresh token for Gmail API.\n');

  // Try to read existing .env.local
  const { env, envPath } = readEnvFile();
  let CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
  let CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';

  // If we have existing credentials, ask if user wants to use them
  if (CLIENT_ID && CLIENT_SECRET) {
    console.log('📋 Found existing credentials in .env.local:');
    console.log(`   CLIENT_ID: ${CLIENT_ID.substring(0, 20)}...`);
    console.log(`   CLIENT_SECRET: ${CLIENT_SECRET.substring(0, 10)}...\n`);
    
    const useExisting = await question('Use these existing credentials? (y/n) [y]: ');
    if (useExisting.toLowerCase() !== 'n' && useExisting.toLowerCase() !== 'no') {
      console.log('✅ Using existing credentials.\n');
    } else {
      CLIENT_ID = '';
      CLIENT_SECRET = '';
    }
  }

  // Get credentials if not found or user wants to enter new ones
  if (!CLIENT_ID) {
    CLIENT_ID = await question('Enter your GOOGLE_CLIENT_ID: ');
  }
  if (!CLIENT_SECRET) {
    CLIENT_SECRET = await question('Enter your GOOGLE_CLIENT_SECRET: ');
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Error: CLIENT_ID and CLIENT_SECRET are required!');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  console.log('\n📋 Follow these steps:');
  console.log('1. A browser window will open automatically');
  console.log('2. Sign in with your Gmail account');
  console.log('3. Click "Allow" to grant Gmail read permissions');
  console.log('4. The script will automatically update your .env.local file\n');

  // Start a temporary server to catch the callback
  const server = http.createServer(async (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    const code = queryObject.code;

    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #4CAF50;">✅ Authorization Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
            <p style="color: #666; font-size: 12px;">Your .env.local file has been updated automatically.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        if (!tokens.refresh_token) {
          console.log('\n⚠️  Warning: No refresh token received.');
          console.log('   This might happen if you already authorized this app before.');
          console.log('   Solution: Revoke access first at: https://myaccount.google.com/permissions');
          console.log('   Then run this script again.\n');
          server.close();
          rl.close();
          process.exit(1);
        }

        // Update .env.local file
        const updatedEnv = {
          GOOGLE_CLIENT_ID: CLIENT_ID,
          GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
          GMAIL_REFRESH_TOKEN: tokens.refresh_token,
          GMAIL_USER: env.GMAIL_USER || 'me',
          NODE_ENV: env.NODE_ENV || 'development',
        };

        writeEnvFile(envPath, updatedEnv);

        console.log('\n✅ Success! Your .env.local file has been updated!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 Updated credentials in .env.local:\n');
        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID.substring(0, 20)}...`);
        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET.substring(0, 10)}...`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token.substring(0, 30)}...`);
        console.log('GMAIL_USER=me');
        console.log('NODE_ENV=development');
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🎉 You can now restart your dev server and test OTP fetching!\n');

        server.close();
        rl.close();
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Error getting token:', error.message);
        console.error('\nFull error:', error);
        server.close();
        rl.close();
        process.exit(1);
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Waiting for authorization...</h1></body></html>');
    }
  });

  server.listen(3000, () => {
    console.log('\n🌐 Temporary server started on http://localhost:3000');
    console.log('   Waiting for authorization...\n');
    
    // Auto-open browser
    const { exec } = require('child_process');
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
      command = `start "" "${authUrl}"`;
    } else if (platform === 'darwin') {
      command = `open "${authUrl}"`;
    } else {
      command = `xdg-open "${authUrl}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log('⚠️  Could not auto-open browser. Please open this URL manually:');
        console.log(`\n   ${authUrl}\n`);
      } else {
        console.log('🌐 Browser opened! Please complete the authorization...\n');
      }
    });
  });
}

getRefreshToken().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
