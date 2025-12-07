import fs from 'fs';
import path from 'path';

export interface EmailAccount {
  email: string;
  password: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  imap: {
    host: string;
    port: number;
    secure: boolean;
  };
  enabled: boolean;
}

interface EmailDatabase {
  accounts: EmailAccount[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'email-accounts.json');

export function getEmailAccount(email: string): EmailAccount | null {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return null;
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');
    const db: EmailDatabase = JSON.parse(data);

    const account = db.accounts.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.enabled
    );

    return account || null;
  } catch (error) {
    console.error('Error reading email database:', error);
    return null;
  }
}

export function getAllAccounts(): EmailAccount[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return [];
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');
    const db: EmailDatabase = JSON.parse(data);

    return db.accounts.filter((acc) => acc.enabled);
  } catch (error) {
    console.error('Error reading email database:', error);
    return [];
  }
}

export function addEmailAccount(account: EmailAccount): boolean {
  try {
    let db: EmailDatabase = { accounts: [] };

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

    // Check if email already exists
    const exists = db.accounts.some(
      (acc) => acc.email.toLowerCase() === account.email.toLowerCase()
    );

    if (exists) {
      return false; // Email already exists
    }

    db.accounts.push(account);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error adding email account:', error);
    return false;
  }
}
