import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import type { EmailAccount } from './email-db';

export interface EmailSearchResult {
  type: 'code' | 'link';
  code?: string;
  link?: string;
  snippet?: string;
  id?: string;
}

export async function fetchLatestCodeFromIMAP(
  account: EmailAccount,
  options: {
    from?: string;
    to?: string;
    subjectQuery?: string;
    codeRegex?: RegExp;
  }
): Promise<EmailSearchResult | null> {
  const { from, to, subjectQuery = '', codeRegex = /\b\d{4,8}\b/ } = options;

  // Remove spaces from password (Gmail app passwords often have spaces)
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
      connTimeout: 10000, // Connection timeout
      keepalive: true,
    },
  };

  let connection: any = null;

  try {
    // Connect to IMAP server
    connection = await imaps.connect(config);

    // Open inbox and get mailbox info
    const box = await connection.openBox('INBOX');
    const totalMessages = box?.messages?.total || box?.exists || 0;
    console.log(`Mailbox has ${totalMessages} total messages`);

    // Build search criteria - search for emails from Netflix info account only
    // Only check emails from: netflix-info@account.netflix.com
    const fetchOptions = {
      bodies: '',
      struct: true,
    };

    console.log('Searching for Netflix emails...');
    
    let messages: any[] = [];
    
    // Helper function to add timeout to search
    const searchWithTimeout = async (criteria: any, timeoutMs: number = 15000) => {
      return Promise.race([
        connection.search(criteria, fetchOptions),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), timeoutMs)
        )
      ]) as Promise<any[]>;
    };
    
    // Strategy: Direct fetch by sequence number (NO SEARCH - avoids timeout!)
    // This is much faster than searching through 36k+ emails
    try {
      if (totalMessages === 0) {
        console.log('⚠️  Mailbox is empty');
        messages = [];
      } else {
        // Fetch last 10 emails by sequence number directly (no search!)
        const startSeq = Math.max(1, totalMessages - 9);
        const endSeq = totalMessages;
        
        console.log(`Fetching last 10 emails by sequence (${startSeq} to ${endSeq})...`);
        
        // Use the underlying imap library to fetch by sequence (fast!)
        const imap = connection.imap;
        
        messages = await new Promise<any[]>((resolve, reject) => {
          const fetchedMessages: any[] = [];
          const seqRange = imap.seq.fetch(`${startSeq}:${endSeq}`, fetchOptions);
          let timeout: NodeJS.Timeout;
          
          seqRange.on('message', (msg: any) => {
            const message: any = { attributes: {} };
            let bodyBuffer = '';
            
            msg.on('body', (stream: any, info: any) => {
              stream.on('data', (chunk: any) => {
                bodyBuffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                message.body = bodyBuffer;
              });
            });
            
            msg.once('attributes', (attrs: any) => {
              message.attributes = attrs;
            });
            
            msg.once('end', () => {
              fetchedMessages.push(message);
            });
          });
          
          seqRange.once('error', (err: any) => {
            clearTimeout(timeout);
            reject(err);
          });
          
          seqRange.once('end', () => {
            clearTimeout(timeout);
            resolve(fetchedMessages);
          });
          
          timeout = setTimeout(() => {
            reject(new Error('Fetch timeout'));
          }, 20000);
        });
        
        console.log(`✅ Fetched ${messages.length} emails`);
      }
    } catch (err: any) {
      console.log(`⚠️  Direct fetch failed: ${err.message}`);
      messages = [];
    }

    if (!messages || messages.length === 0) {
      console.log('No emails found in inbox');
      return null;
    }

    console.log(`Found ${messages.length} email(s) to check`);

    // Process messages (most recent first)
    const sortedMessages = messages.sort((a: any, b: any) => {
      const dateA = a.attributes.date?.getTime() || 0;
      const dateB = b.attributes.date?.getTime() || 0;
      return dateB - dateA;
    });

    // Check only the 10 most recent emails
    for (const message of sortedMessages.slice(0, 10)) {
      console.log(`Processing message ${message.attributes.uid}...`);
      const result = await processMessage(connection, message, codeRegex);
      if (result) {
        console.log('Found Netflix code/link!');
        return result;
      }
    }
    
    // Debug: Log what emails were checked
    console.log('Checked emails but no code found. Email subjects:');
    for (const msg of sortedMessages.slice(0, 10)) {
      console.log(`  - UID: ${msg.attributes.uid}, Date: ${msg.attributes.date}`);
    }

    console.log('No Netflix code or link found in checked emails');
    return null;
  } catch (error: any) {
    console.error('IMAP Error:', error);
    throw new Error(
      `Failed to fetch emails: ${error.message || 'Unknown error'}`
    );
  } finally {
    if (connection) {
      try {
        connection.end();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

async function processMessage(
  connection: any,
  message: any,
  codeRegex: RegExp
): Promise<EmailSearchResult | null> {
  try {
    let parsed: any;
    
    // If body was already fetched (from direct fetch), use it
    if (message.body && typeof message.body === 'string') {
      parsed = await simpleParser(message.body);
    } else {
      // Otherwise, fetch using the normal method
      const parts = imaps.getParts(message.attributes.struct);

      // Find text/html or text/plain part
      const textPart = parts.find(
        (part: any) =>
          part.partID &&
          (part.disposition === undefined || part.disposition.type === 'INLINE') &&
          (part.type === 'text/html' || part.type === 'text/plain')
      );

      if (!textPart) {
        return null;
      }

      // Fetch the email body
      const source = await connection.getPartData(message, textPart);
      parsed = await simpleParser(source);
    }

    // Get text content (prefer plain text, fallback to HTML)
    let text = parsed.text || '';
    
    // If no plain text, extract text from HTML
    if (!text && parsed.html) {
      // Remove HTML tags and decode entities
      text = parsed.html
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }
    
    const subject = parsed.subject || '';
    const fromEmail = parsed.from?.value?.[0]?.address || '';

    // Process if it's from any Netflix domain
    if (!fromEmail || !fromEmail.includes('netflix.com')) {
      console.log(`Skipping email from ${fromEmail} (not Netflix)`);
      return null;
    }

    console.log(`Checking email: "${subject}" from ${fromEmail}`);
    console.log(`Email text preview: ${text.substring(0, 200)}...`);

    // Check for household/update links first
    const linkMatch = text.match(
      /https?:\/\/(?:www\.)?netflix\.com\/account\/(?:update-primary|set-primary)[^\s"'<>]*/i
    );
    if (linkMatch) {
      console.log('Found household update link!');
      return {
        type: 'link',
        link: linkMatch[0],
        snippet: subject,
        id: message.attributes.uid?.toString(),
      };
    }

    // Check for OTP codes - look for 4-8 digit codes
    // Netflix codes are usually 4-8 digits, often in bold or large text
    // Try multiple patterns to catch different formats
    
    // Pattern 1: Look for codes near "code" or "verification" keywords
    const codeNearKeywords = text.match(/(?:code|verification|enter|use|your)[\s:]*(\d{4,8})/i);
    if (codeNearKeywords && codeNearKeywords[1]) {
      const code = codeNearKeywords[1];
      if (code.length >= 4 && code.length <= 8) {
        console.log(`Found Netflix code (near keyword): ${code}`);
        return {
          type: 'code',
          code: code,
          snippet: subject,
          id: message.attributes.uid?.toString(),
        };
      }
    }

    // Pattern 2: Look for standalone 4-8 digit numbers (most common)
    // But exclude dates, years, phone numbers, etc.
    const standaloneCodes = text.match(/\b(\d{4,8})\b/g);
    if (standaloneCodes) {
      for (const match of standaloneCodes) {
        const code = match;
        // Exclude common false positives
        if (
          code.length >= 4 && 
          code.length <= 8 &&
          !code.match(/^(19|20)\d{2}$/) && // Not a year
          !code.match(/^\d{4}-\d{2}-\d{2}/) && // Not a date
          parseInt(code) > 1000 // Not too small
        ) {
          // Check if it's in a context that suggests it's a code
          const codeIndex = text.indexOf(code);
          const context = text.substring(Math.max(0, codeIndex - 50), Math.min(text.length, codeIndex + 50)).toLowerCase();
          
          if (
            context.includes('code') ||
            context.includes('verification') ||
            context.includes('enter') ||
            context.includes('minutes') ||
            context.includes('expires')
          ) {
            console.log(`Found Netflix code (standalone): ${code}`);
            return {
              type: 'code',
              code: code,
              snippet: subject,
              id: message.attributes.uid?.toString(),
            };
          }
        }
      }
    }

    // Pattern 3: Look for codes in HTML with specific styling (large/bold numbers)
    if (parsed.html) {
      const htmlCodeMatch = parsed.html.match(/(?:<[^>]+>[\s]*)?(\d{4,8})(?:[\s]*<\/[^>]+>)?/);
      if (htmlCodeMatch && htmlCodeMatch[1]) {
        const code = htmlCodeMatch[1];
        if (code.length >= 4 && code.length <= 8) {
          console.log(`Found Netflix code (HTML): ${code}`);
          return {
            type: 'code',
            code: code,
            snippet: subject,
            id: message.attributes.uid?.toString(),
          };
        }
      }
    }

    return null;

    return null;
  } catch (error) {
    console.error('Error processing message:', error);
    return null;
  }
}
