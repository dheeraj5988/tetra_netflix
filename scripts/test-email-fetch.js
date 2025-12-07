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

const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const { getEmailAccount } = require('../lib/email-db');

async function testEmailFetch() {
  console.log('\n📧 Testing Email Fetching - Any Emails\n');
  console.log('='.repeat(70));

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
  console.log(`   IMAP Port: ${account.imap.port}\n`);

  // Remove spaces from password
  const cleanPassword = account.password.replace(/\s/g, '');

  const config = {
    imap: {
      user: account.email,
      password: cleanPassword,
      host: account.imap.host,
      port: account.imap.port,
      tls: account.imap.secure,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 10000,
      keepalive: true,
    },
  };

  let connection = null;

  try {
    console.log('🔌 Connecting to IMAP server...');
    connection = await imaps.connect(config);
    console.log('✅ Connected successfully!\n');

    console.log('📂 Opening INBOX...');
    const box = await connection.openBox('INBOX');
    console.log('✅ INBOX opened!\n');

    // Get mailbox info from box object
    const totalMessages = box?.messages?.total || box?.exists || 0;
    console.log(`📊 Mailbox Info:`);
    console.log(`   Total messages: ${totalMessages}`);
    console.log(`   Recent messages: ${box?.messages?.new || box?.recent || 0}`);
    console.log(`   Unseen messages: ${box?.messages?.unseen || box?.unseen || 0}\n`);

    const fetchOptions = {
      bodies: '',
      struct: true,
    };

    console.log('🔍 Fetching latest 5 emails...\n');
    
    let messages = [];
    
    try {
      // Method 1: Search emails from last 7 days (much faster than ALL)
      console.log('   Method 1: Searching emails from last 7 days...');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Format date for IMAP: DD-MMM-YYYY
      const dateStr = sevenDaysAgo.toISOString().split('T')[0].split('-').reverse().join('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const imapDate = `${sevenDaysAgo.getDate()}-${monthNames[sevenDaysAgo.getMonth()]}-${sevenDaysAgo.getFullYear()}`;
      
      const uidSearch = await Promise.race([
        connection.search(['SINCE', imapDate], { struct: true, bodies: '' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 20000)
        )
      ]);
      
      if (uidSearch && uidSearch.length > 0) {
        console.log(`   ✅ Found ${uidSearch.length} emails from last 7 days`);
        
        // Get last 5 UIDs (most recent)
        const last5UIDs = uidSearch.slice(-5).map(m => m.attributes.uid);
        console.log(`   Fetching full content for last 5 emails...\n`);
        
        // Fetch full content by UID
        messages = await Promise.race([
          connection.fetch(last5UIDs, fetchOptions),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 20000)
          )
        ]);
        
        console.log(`   ✅ Successfully fetched ${messages.length} emails\n`);
      } else {
        console.log('   ⚠️  No emails found in last 7 days');
        messages = [];
      }
    } catch (err) {
      console.log(`   ⚠️  Date search failed: ${err.message}`);
      console.log(`   Trying Method 2: Fetch last 5 by sequence...\n`);
      
      try {
        // Method 2: Use the underlying imap library to fetch by sequence
        if (totalMessages > 0) {
          const startSeq = Math.max(1, totalMessages - 4);
          const endSeq = totalMessages;
          console.log(`   Fetching sequence ${startSeq} to ${endSeq} using imap library...`);
          
          // Access the underlying node-imap connection
          const imap = connection.imap;
          
          // Use imap's fetch method directly
          return new Promise((resolve) => {
            const fetchedMessages = [];
            const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
              bodies: '',
              struct: true,
            });
            
            fetch.on('message', (msg) => {
              const message = { attributes: {}, parts: [] };
              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                stream.once('end', () => {
                  message.body = buffer;
                });
              });
              msg.once('attributes', (attrs) => {
                message.attributes = attrs;
              });
              msg.once('end', () => {
                fetchedMessages.push(message);
              });
            });
            
            fetch.once('error', (err) => {
              console.log(`   ⚠️  Fetch error: ${err.message}\n`);
              resolve([]);
            });
            
            fetch.once('end', () => {
              messages = fetchedMessages;
              console.log(`   ✅ Fetched ${messages.length} emails\n`);
              resolve(messages);
            });
            
            setTimeout(() => {
              fetch.destroy();
              console.log(`   ⚠️  Fetch timeout\n`);
              resolve([]);
            }, 20000);
          }).then(() => {
            // Continue with processing
          });
        } else {
          throw new Error('Cannot fetch: mailbox shows 0 messages');
        }
      } catch (err2) {
        console.log(`   ⚠️  Sequence fetch failed: ${err2.message}\n`);
        console.log(`   💡 Summary:`);
        console.log(`      - Connection: ✅ Working`);
        console.log(`      - Authentication: ✅ Working`);
        console.log(`      - Mailbox opened: ✅ Working`);
        console.log(`      - Email search: ❌ ${err.message}`);
        console.log(`   \n   The issue: Gmail search is timing out.`);
        console.log(`   This is common with large mailboxes.\n`);
        messages = [];
      }
    }

    if (!messages || messages.length === 0) {
      console.log('⚠️  No emails could be fetched');
      console.log('\n💡 This could mean:');
      console.log('   1. Mailbox is actually empty');
      console.log('   2. Gmail search is too slow (large mailbox)');
      console.log('   3. Network/connection issues');
      console.log('\n   But the connection itself is working! ✅\n');
      process.exit(0);
    }

    console.log(`✅ Successfully fetched ${messages.length} email(s)\n`);

    // Sort by date (most recent first)
    const sortedMessages = messages.sort((a, b) => {
      const dateA = a.attributes.date?.getTime() || 0;
      const dateB = b.attributes.date?.getTime() || 0;
      return dateB - dateA;
    });

    // Get top 5 most recent emails
    const top5Messages = sortedMessages.slice(0, 5);

    console.log('='.repeat(70));
    console.log('\n📬 Latest 5 Emails:\n');

    for (let i = 0; i < top5Messages.length; i++) {
      const message = top5Messages[i];
      
      try {
        const parts = imaps.getParts(message.attributes.struct);

        // Find text/html or text/plain part
        const textPart = parts.find(
          (part) =>
            part.partID &&
            (part.disposition === undefined || part.disposition.type === 'INLINE') &&
            (part.type === 'text/html' || part.type === 'text/plain')
        );

        if (!textPart) {
          console.log(`\n📧 Email #${i + 1}:`);
          console.log(`   UID: ${message.attributes.uid}`);
          console.log(`   Date: ${message.attributes.date || 'N/A'}`);
          console.log(`   ⚠️  Could not parse email body`);
          continue;
        }

        const source = await connection.getPartData(message, textPart);
        const parsed = await simpleParser(source);

        const subject = parsed.subject || '(No Subject)';
        const fromEmail = parsed.from?.value?.[0]?.address || 'Unknown';
        const fromName = parsed.from?.value?.[0]?.name || '';
        const date = parsed.date || message.attributes.date || new Date();
        const text = parsed.text || '';
        const html = parsed.html || '';
        
        // Get preview (first 150 chars)
        let preview = text.substring(0, 150);
        if (!preview && html) {
          preview = html.replace(/<[^>]+>/g, ' ').substring(0, 150);
        }
        if (preview.length >= 150) preview += '...';

        console.log(`\n📧 Email #${i + 1}:`);
        console.log(`   From: ${fromName ? `${fromName} ` : ''}<${fromEmail}>`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Date: ${date.toLocaleString()}`);
        console.log(`   Preview: ${preview || '(No text content)'}`);
        console.log(`   UID: ${message.attributes.uid}`);

      } catch (err) {
        console.log(`\n📧 Email #${i + 1}:`);
        console.log(`   UID: ${message.attributes.uid}`);
        console.log(`   ⚠️  Error parsing: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Email fetching test completed successfully!\n');
    console.log('💡 If you can see emails above, IMAP connection is working!');
    console.log('   Now we can proceed to test Netflix-specific email fetching.\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
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
    
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  } finally {
    if (connection) {
      try {
        connection.end();
        console.log('🔌 Connection closed.\n');
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

testEmailFetch();
