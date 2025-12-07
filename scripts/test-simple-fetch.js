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

async function testSimpleFetch() {
  console.log('\n📧 Fetching Top 5 Emails (No Search, Direct Fetch)\n');
  console.log('='.repeat(70));

  const email = 'dsharma259889@gmail.com';
  console.log(`\n📧 Email: ${email}\n`);

  const account = getEmailAccount(email);
  
  if (!account) {
    console.error('❌ Email not found in database!');
    process.exit(1);
  }

  console.log('✅ Email found in database\n');

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
    },
  };

  let connection = null;

  try {
    console.log('🔌 Connecting...');
    connection = await imaps.connect(config);
    console.log('✅ Connected!\n');

    console.log('📂 Opening INBOX...');
    const box = await connection.openBox('INBOX');
    const totalMessages = box?.messages?.total || box?.exists || 0;
    console.log(`✅ INBOX opened! Total messages: ${totalMessages}\n`);

    if (totalMessages === 0) {
      console.log('⚠️  Mailbox is empty');
      process.exit(0);
    }

    // Fetch last 5 emails by sequence number (NO SEARCH - direct fetch)
    const startSeq = Math.max(1, totalMessages - 4);
    const endSeq = totalMessages;
    
    console.log(`📥 Fetching last 5 emails (sequence ${startSeq} to ${endSeq})...\n`);

    // Use the underlying imap library to fetch by sequence
    const imap = connection.imap;
    const fetchOptions = {
      bodies: '',
      struct: true,
    };

    const messages = await new Promise((resolve, reject) => {
      const fetchedMessages = [];
      const seqRange = imap.seq.fetch(`${startSeq}:${endSeq}`, fetchOptions);
      
      seqRange.on('message', (msg) => {
        const message = { attributes: {}, parts: [] };
        let bodyBuffer = '';
        
        msg.on('body', (stream, info) => {
          stream.on('data', (chunk) => {
            bodyBuffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            message.body = bodyBuffer;
          });
        });
        
        msg.once('attributes', (attrs) => {
          message.attributes = attrs;
        });
        
        msg.once('end', () => {
          fetchedMessages.push(message);
        });
      });
      
      seqRange.once('error', (err) => {
        reject(err);
      });
      
      seqRange.once('end', () => {
        resolve(fetchedMessages);
      });
      
      const timeout = setTimeout(() => {
        reject(new Error('Fetch timeout'));
      }, 20000);
      
      seqRange.once('end', () => {
        clearTimeout(timeout);
      });
    });

    console.log(`✅ Fetched ${messages.length} emails!\n`);

    console.log('='.repeat(70));
    console.log('\n📬 Top 5 Emails:\n');

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      try {
        // Parse the email body
        const parsed = await simpleParser(msg.body);
        
        const subject = parsed.subject || '(No Subject)';
        const fromEmail = parsed.from?.value?.[0]?.address || 'Unknown';
        const fromName = parsed.from?.value?.[0]?.name || '';
        const date = parsed.date || msg.attributes.date || new Date();
        const text = parsed.text || '';
        const html = parsed.html || '';
        
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
        console.log(`   UID: ${msg.attributes.uid}`);

      } catch (err) {
        console.log(`\n📧 Email #${i + 1}:`);
        console.log(`   UID: ${msg.attributes.uid}`);
        console.log(`   ⚠️  Error parsing: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Success! Fetched top 5 emails without search!\n');

  } catch (error) {
    console.error('\n❌ ERROR:\n');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        connection.end();
        console.log('🔌 Connection closed.\n');
      } catch (e) {
        // Ignore
      }
    }
  }
}

testSimpleFetch();
