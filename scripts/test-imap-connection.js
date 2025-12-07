// Use ts-node to load TypeScript files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    target: 'ES2020',
  },
});

const { getEmailAccount } = require('../lib/email-db');
const { fetchLatestCodeFromIMAP } = require('../lib/imap-email');

async function testIMAPConnection() {
  console.log('\n🧪 Testing IMAP Connection & Email Fetching\n');
  console.log('='.repeat(60));

  // Get email from database
  const email = 'dsharma259889@gmail.com';
  console.log(`\n📧 Testing with email: ${email}\n`);

  const account = getEmailAccount(email);
  
  if (!account) {
    console.error('❌ Email not found in database!');
    console.log('   Make sure the email is added to data/email-accounts.json');
    process.exit(1);
  }

  console.log('✅ Email found in database');
  console.log(`   Provider: ${account.provider}`);
  console.log(`   IMAP Host: ${account.imap.host}`);
  console.log(`   IMAP Port: ${account.imap.port}`);
  console.log(`   Password: ${account.password.substring(0, 4)}...${account.password.substring(account.password.length - 2)}\n`);

  console.log('🔌 Connecting to IMAP server...\n');

  try {
    const result = await fetchLatestCodeFromIMAP(account, {
      to: email,
    });

    console.log('\n' + '='.repeat(60));
    
    if (result) {
      console.log('\n✅ SUCCESS! Found result:\n');
      console.log(`   Type: ${result.type}`);
      if (result.type === 'code') {
        console.log(`   Code: ${result.code}`);
      } else {
        console.log(`   Link: ${result.link}`);
      }
      console.log(`   Subject: ${result.snippet || 'N/A'}`);
      console.log(`   Message ID: ${result.id || 'N/A'}`);
    } else {
      console.log('\n⚠️  Connection successful, but no Netflix code/link found.');
      console.log('   This could mean:');
      console.log('   - No Netflix emails in inbox');
      console.log('   - Emails are too old');
      console.log('   - Code format doesn\'t match patterns');
      console.log('\n   Check the server console logs above for details.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ IMAP connection test completed!\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('\n❌ ERROR:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('Invalid credentials') || error.message.includes('authentication')) {
      console.log('💡 Troubleshooting:');
      console.log('   1. Check your app password in data/email-accounts.json');
      console.log('   2. Make sure you removed spaces from the password');
      console.log('   3. Regenerate app password if needed');
      console.log('   4. Verify IMAP is enabled in Gmail settings\n');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Troubleshooting:');
      console.log('   1. Check your internet connection');
      console.log('   2. Gmail might be blocking/throttling the connection');
      console.log('   3. Try again in a few minutes\n');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('💡 Troubleshooting:');
      console.log('   1. Check IMAP host settings');
      console.log('   2. Verify firewall isn\'t blocking port 993');
      console.log('   3. Check your internet connection\n');
    }
    
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

testIMAPConnection();
