/**
 * iFi Backend - Encryption Utilities
 * Secure encryption and decryption for sensitive data (Plaid access tokens)
 */

const crypto = require('crypto');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Get encryption key from environment
 * @returns {Buffer} Encryption key as buffer
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Convert hex string to buffer (key should be 64 hex chars = 32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data (e.g., Plaid access tokens)
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:encryptedData
 */
function encrypt(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by colon
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Invalid input: encryptedText must be a non-empty string');
    }
    
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random encryption key
 * @returns {string} 64 character hex string (32 bytes)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data (one-way, for verification only)
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verify webhook signature from Plaid
 * @param {string} signature - Signature from Plaid-Verification header
 * @param {string} body - Raw request body
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(signature, body) {
  try {
    const webhookSecret = process.env.PLAID_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('PLAID_WEBHOOK_SECRET not set - webhook verification disabled');
      return true; // Allow in development, but log warning
    }
    
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error.message);
    return false;
  }
}

/**
 * Generate secure random token (for session tokens, etc.)
 * @param {number} length - Length in bytes (default 32)
 * @returns {string} Random token as hex string
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hash,
  verifyWebhookSignature,
  generateSecureToken
};
