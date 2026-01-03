/**
 * iFi Backend - Plaid API Routes
 * Endpoints for Plaid Link integration
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const plaidService = require('../services/plaidService');
const { verifyWebhookSignature } = require('../utils/encryption');

/**
 * POST /api/plaid/create_link_token
 * Create a link token for Plaid Link initialization
 */
router.post('/create_link_token',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }
      
      const { userId } = req.body;
      
      console.log(`Creating link token for user ${userId}`);
      
      // Create link token via Plaid
      const linkTokenData = await plaidService.createLinkToken(userId);
      
      res.json({
        success: true,
        link_token: linkTokenData.link_token,
        expiration: linkTokenData.expiration,
      });
      
    } catch (error) {
      console.error('Create link token error:', error.message);
      
      // If Plaid is not configured, return a more user-friendly error
      const isConfigError = error.message.includes('not configured');
      
      res.status(isConfigError ? 503 : 500).json({
        error: isConfigError ? 'Service unavailable' : 'Failed to create link token',
        message: error.message,
        configured: !isConfigError,
        optional: true // Indicate this feature is optional
      });
    }
  }
);

/**
 * POST /api/plaid/exchange_public_token
 * Exchange public token for access token and store connection
 */
router.post('/exchange_public_token',
  [
    body('public_token').notEmpty().withMessage('Public token is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('accounts').isArray().withMessage('Accounts must be an array'),
    body('institution').isObject().withMessage('Institution must be an object'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }
      
      const { public_token, userId, accounts, institution } = req.body;
      
      console.log(`Exchanging public token for user ${userId}`);
      
      // Exchange public token for access token
      const { access_token, item_id } = await plaidService.exchangePublicToken(public_token);
      
      // Get detailed institution information
      const institutionDetails = await plaidService.getInstitution(access_token);
      
      // Get account balances
      const accountsWithBalances = await plaidService.getAccounts(access_token);
      
      // Store connection in database
      const connection = await plaidService.storePlaidConnection(
        userId,
        item_id,
        access_token,
        institutionDetails,
        accountsWithBalances
      );
      
      // Trigger initial transaction sync (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Sync transactions asynchronously (don't wait for it)
      plaidService.syncTransactions(item_id, startDate, endDate)
        .then(count => console.log(`Initial sync completed: ${count} transactions`))
        .catch(error => console.error('Initial sync failed:', error.message));
      
      res.json({
        success: true,
        item_id: item_id,
        institution: institutionDetails.name,
        accounts: accountsWithBalances.length,
        message: 'Bank connection established successfully',
      });
      
    } catch (error) {
      console.error('Exchange public token error:', error.message);
      res.status(500).json({
        error: 'Failed to exchange token',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/plaid/connections/:userId
 * Get all Plaid connections for a user
 */
router.get('/connections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const connections = await plaidService.getUserPlaidConnections(userId);
    
    res.json({
      success: true,
      connections: connections,
    });
    
  } catch (error) {
    console.error('Get connections error:', error.message);
    res.status(500).json({
      error: 'Failed to get connections',
      message: error.message,
    });
  }
});

/**
 * POST /api/plaid/sync/:itemId
 * Manually trigger transaction sync for a connection
 */
router.post('/sync/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { startDate, endDate } = req.body;
    
    // Default to last 30 days if not provided
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const count = await plaidService.syncTransactions(
      itemId,
      startDate || defaultStartDate,
      endDate || today
    );
    
    res.json({
      success: true,
      synced_transactions: count,
      message: `Successfully synced ${count} transactions`,
    });
    
  } catch (error) {
    console.error('Manual sync error:', error.message);
    res.status(500).json({
      error: 'Failed to sync transactions',
      message: error.message,
    });
  }
});

/**
 * POST /api/plaid/webhook
 * Handle Plaid webhook notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['plaid-verification'];
    const rawBody = JSON.stringify(req.body);
    
    // Verify webhook signature (security)
    if (signature && !verifyWebhookSignature(signature, rawBody)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { webhook_type, webhook_code, item_id, error } = req.body;
    
    console.log(`Received webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`);
    
    // Handle different webhook types
    if (webhook_type === 'TRANSACTIONS') {
      // New transactions available
      if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        // Sync transactions asynchronously
        plaidService.syncTransactions(item_id, startDate, today)
          .then(count => console.log(`Webhook sync completed: ${count} transactions`))
          .catch(error => console.error('Webhook sync failed:', error.message));
      }
      
      if (webhook_code === 'TRANSACTIONS_REMOVED') {
        console.log(`Transactions removed for item ${item_id}`);
        // Handle transaction removal if needed
      }
    }
    
    if (webhook_type === 'ITEM') {
      // Connection status updates
      if (webhook_code === 'ITEM_LOGIN_REQUIRED') {
        // User needs to re-authenticate
        await plaidService.updateConnectionStatus(item_id, 'reauth_required');
        console.log(`Item ${item_id} requires re-authentication`);
        
        // TODO: Send email/notification to user
      }
      
      if (webhook_code === 'ERROR') {
        console.error(`Item error for ${item_id}:`, error);
        await plaidService.updateConnectionStatus(item_id, 'reauth_required');
      }
      
      if (webhook_code === 'PENDING_EXPIRATION') {
        console.warn(`Item ${item_id} access will expire soon`);
        // TODO: Notify user to refresh connection
      }
    }
    
    // Always respond with 200 to acknowledge receipt
    res.json({ success: true, received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    // Still return 200 to prevent Plaid from retrying
    res.json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/plaid/connection/:itemId
 * Remove a Plaid connection
 */
router.delete('/connection/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Update status to disconnected
    await plaidService.updateConnectionStatus(itemId, 'disconnected');
    
    res.json({
      success: true,
      message: 'Connection removed successfully',
    });
    
  } catch (error) {
    console.error('Remove connection error:', error.message);
    res.status(500).json({
      error: 'Failed to remove connection',
      message: error.message,
    });
  }
});

module.exports = router;
