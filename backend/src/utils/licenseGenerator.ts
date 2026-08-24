import crypto from 'crypto';

/**
 * Generates a formatted cryptographically secure serial license key.
 * Example: AQPOS-9F8A-7B2C-4E1D-5A6B
 */
export function generateLicenseKey(prefix = 'AQPOS'): string {
  const blocks = 4;
  const blockSize = 4;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing 0/O, 1/I

  const keyParts: string[] = [prefix];

  for (let i = 0; i < blocks; i++) {
    let block = '';
    const bytes = crypto.randomBytes(blockSize);
    for (let j = 0; j < blockSize; j++) {
      block += chars[bytes[j] % chars.length];
    }
    keyParts.push(block);
  }

  return keyParts.join('-');
}

/**
 * Calculates license expiry date based on start date and billing period.
 */
export function calculateExpiryDate(startDate: Date, billingPeriod: string): Date {
  const expiry = new Date(startDate.getTime());

  switch (billingPeriod.toUpperCase()) {
    case 'MONTHLY':
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    case 'QUARTERLY':
      expiry.setMonth(expiry.getMonth() + 3);
      break;
    case 'HALF_YEARLY':
      expiry.setMonth(expiry.getMonth() + 6);
      break;
    case 'YEARLY':
    case 'ANNUAL':
      expiry.setFullYear(expiry.getFullYear() + 1);
      break;
    case 'LIFETIME':
    case 'PERPETUAL':
      expiry.setFullYear(expiry.getFullYear() + 100);
      break;
    default:
      expiry.setFullYear(expiry.getFullYear() + 1);
      break;
  }

  return expiry;
}
