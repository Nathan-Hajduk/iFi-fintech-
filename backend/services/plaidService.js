/**
 * iFi Backend - Plaid API Service
 * Handles all Plaid API interactions
 */

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const db = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

// Check if Plaid credentials are configured
const PLAID_CONFIGURED = !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

if (!PLAID_CONFIGURED) {
  console.warn('⚠️  Plaid credentials not configured. Bank connection features will be unavailable.');
  console.warn('   To enable Plaid integration, set PLAID_CLIENT_ID and PLAID_SECRET in your .env file');
}

// Initialize Plaid client only if credentials are available
let plaidClient = null;

if (PLAID_CONFIGURED) {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  plaidClient = new PlaidApi(configuration);
  console.log('✅ Plaid client initialized successfully');
}

/**
 * Create a link token for Plaid Link initialization
 * @param {string} userId - User ID from database
 * @returns {Promise<Object>} Link token data
 */
async function createLinkToken(userId) {
  // Check if Plaid is configured
  if (!PLAID_CONFIGURED || !plaidClient) {
    throw new Error('Plaid integration is not configured. Bank connection features are unavailable.');
  }
  
  try {
    const request = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'iFi Financial Platform',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: process.env.WEBHOOK_URL || 'https://yourdomain.com/api/plaid/webhook',
      redirect_uri: process.env.FRONTEND_URL || 'http://localhost:3000',
    };
    
    const response = await plaidClient.linkTokenCreate(request);
    
    console.log(`Link token created for user ${userId}`);
    
    return {
      link_token: response.data.link_token,
      expiration: response.data.expiration,
      request_id: response.data.request_id,
    };
  } catch (error) {
    console.error('Plaid createLinkToken error:', error.response?.data || error.message);
    throw new Error('Failed to create link token: ' + (error.response?.data?.error_message || error.message));
  }
}

/**
 * Exchange public token for access token
 * @param {string} publicToken - Temporary public token from Plaid Link
 * @returns {Promise<Object>} Access token and item ID
 */
async function exchangePublicToken(publicToken) {
  // Check if Plaid is configured
  if (!PLAID_CONFIGURED || !plaidClient) {
    throw new Error('Plaid integration is not configured. Bank connection features are unavailable.');
  }
  
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    console.log(`Public token exchanged successfully. Item ID: ${itemId}`);
    
    return {
      access_token: accessToken,
      item_id: itemId,
    };
  } catch (error) {
    console.error('Plaid exchangePublicToken error:', error.response?.data || error.message);
    throw new Error('Failed to exchange public token: ' + (error.response?.data?.error_message || error.message));
  }
}

/**
 * Get institution information
 * @param {string} accessToken - Plaid access token
 * @returns {Promise<Object>} Institution details
 */
async function getInstitution(accessToken) {
  try {
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });
    
    const institutionId = itemResponse.data.item.institution_id;
    
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'],
    });
    
    return {
      institution_id: institutionId,
      name: institutionResponse.data.institution.name,
      logo: institutionResponse.data.institution.logo,
      url: institutionResponse.data.institution.url,
    };
  } catch (error) {
    console.error('Plaid getInstitution error:', error.response?.data || error.message);
    return {
      institution_id: null,
      name: 'Unknown Institution',
      logo: null,
      url: null,
    };
  }
}

/**
 * Get account balances
 * @param {string} accessToken - Plaid access token
 * @returns {Promise<Array>} List of accounts with balances
 */
async function getAccounts(accessToken) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    return response.data.accounts.map(account => ({
      account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      balance: {
        current: account.balances.current,
        available: account.balances.available,
        limit: account.balances.limit,
        currency: account.balances.iso_currency_code || 'USD',
      },
      mask: account.mask,
    }));
  } catch (error) {
    console.error('Plaid getAccounts error:', error.response?.data || error.message);
    throw new Error('Failed to get accounts: ' + (error.response?.data?.error_message || error.message));
  }
}

/**
 * Fetch transactions from Plaid
 * @param {string} accessToken - Plaid access token
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} List of transactions
 */
async function getTransactions(accessToken, startDate, endDate) {
  try {
    let hasMore = true;
    let cursor = null;
    let allTransactions = [];
    
    while (hasMore) {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset: cursor || 0,
        },
      };
      
      const response = await plaidClient.transactionsGet(request);
      const transactions = response.data.transactions;
      
      allTransactions = allTransactions.concat(transactions);
      
      const totalTransactions = response.data.total_transactions;
      hasMore = allTransactions.length < totalTransactions;
      cursor = allTransactions.length;
      
      console.log(`Fetched ${allTransactions.length} of ${totalTransactions} transactions`);
    }
    
    return allTransactions.map(txn => ({
      transaction_id: txn.transaction_id,
      account_id: txn.account_id,
      amount: txn.amount,
      date: txn.date,
      name: txn.name,
      merchant_name: txn.merchant_name,
      category: txn.category ? txn.category[0] : 'Uncategorized',
      subcategory: txn.category ? txn.category[1] : null,
      pending: txn.pending,
      payment_channel: txn.payment_channel,
    }));
  } catch (error) {
    console.error('Plaid getTransactions error:', error.response?.data || error.message);
    throw new Error('Failed to get transactions: ' + (error.response?.data?.error_message || error.message));
  }
}

/**
 * Store Plaid connection in database
 * @param {number} userId - User ID
 * @param {string} itemId - Plaid item ID
 * @param {string} accessToken - Plaid access token (will be encrypted)
 * @param {Object} institution - Institution details
 * @param {Array} accounts - List of accounts
 * @returns {Promise<Object>} Created connection record
 */
async function storePlaidConnection(userId, itemId, accessToken, institution, accounts) {
  try {
    // Encrypt access token before storage
    const encryptedToken = encrypt(accessToken);
    
    const result = await db.query(
      `INSERT INTO plaid_connections 
       (user_id, item_id, access_token, institution_id, institution_name, accounts, status, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (item_id) 
       DO UPDATE SET 
         access_token = EXCLUDED.access_token,
         accounts = EXCLUDED.accounts,
         updated_at = NOW()
       RETURNING id, item_id, institution_name, created_at`,
      [
        userId,
        itemId,
        encryptedToken,
        institution.institution_id,
        institution.name,
        JSON.stringify(accounts),
        'active'
      ]
    );
    
    console.log(`Plaid connection stored for user ${userId}, item ${itemId}`);
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error storing Plaid connection:', error.message);
    throw new Error('Failed to store Plaid connection');
  }
}

/**
 * Get Plaid connection by item ID
 * @param {string} itemId - Plaid item ID
 * @returns {Promise<Object|null>} Connection record
 */
async function getPlaidConnection(itemId) {
  try {
    const result = await db.query(
      'SELECT * FROM plaid_connections WHERE item_id = $1',
      [itemId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error getting Plaid connection:', error.message);
    throw error;
  }
}

/**
 * Get all Plaid connections for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of connections
 */
async function getUserPlaidConnections(userId) {
  try {
    const result = await db.query(
      `SELECT id, item_id, institution_name, accounts, status, last_synced_at, created_at
       FROM plaid_connections
       WHERE user_id = $1 AND status != 'disconnected'
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Database error getting user Plaid connections:', error.message);
    throw error;
  }
}

/**
 * Update connection status
 * @param {string} itemId - Plaid item ID
 * @param {string} status - New status (active, reauth_required, disconnected)
 * @returns {Promise<void>}
 */
async function updateConnectionStatus(itemId, status) {
  try {
    await db.query(
      'UPDATE plaid_connections SET status = $1, updated_at = NOW() WHERE item_id = $2',
      [status, itemId]
    );
    
    console.log(`Connection ${itemId} status updated to ${status}`);
  } catch (error) {
    console.error('Database error updating connection status:', error.message);
    throw error;
  }
}

/**
 * Sync transactions for a connection
 * @param {string} itemId - Plaid item ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<number>} Number of transactions synced
 */
async function syncTransactions(itemId, startDate, endDate) {
  try {
    // Get connection from database
    const connection = await getPlaidConnection(itemId);
    
    if (!connection) {
      throw new Error(`Connection not found for item ${itemId}`);
    }
    
    // Decrypt access token
    const accessToken = decrypt(connection.access_token);
    
    // Fetch transactions from Plaid
    const transactions = await getTransactions(accessToken, startDate, endDate);
    
    // Store transactions in database
    let syncedCount = 0;
    
    for (const txn of transactions) {
      try {
        await db.query(
          `INSERT INTO transactions 
           (user_id, plaid_connection_id, transaction_id, account_id, amount, date, name, 
            merchant_name, category, subcategory, pending, payment_channel)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (transaction_id) 
           DO UPDATE SET 
             amount = EXCLUDED.amount,
             pending = EXCLUDED.pending,
             updated_at = NOW()`,
          [
            connection.user_id,
            connection.id,
            txn.transaction_id,
            txn.account_id,
            txn.amount,
            txn.date,
            txn.name,
            txn.merchant_name,
            txn.category,
            txn.subcategory,
            txn.pending,
            txn.payment_channel
          ]
        );
        
        syncedCount++;
      } catch (error) {
        console.error(`Failed to store transaction ${txn.transaction_id}:`, error.message);
      }
    }
    
    // Update last synced timestamp
    await db.query(
      'UPDATE plaid_connections SET last_synced_at = NOW() WHERE item_id = $1',
      [itemId]
    );
    
    console.log(`Synced ${syncedCount} transactions for item ${itemId}`);
    
    return syncedCount;
  } catch (error) {
    console.error('Error syncing transactions:', error.message);
    throw error;
  }
}

module.exports = {
  plaidClient,
  createLinkToken,
  exchangePublicToken,
  getInstitution,
  getAccounts,
  getTransactions,
  storePlaidConnection,
  getPlaidConnection,
  getUserPlaidConnections,
  updateConnectionStatus,
  syncTransactions,
};
