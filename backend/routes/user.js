/**
 * User Data Routes
 * Handles user profile, analytics, onboarding data, and dashboard data
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GET /api/user/profile
 * Get current user profile information
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        user_id,
        email,
        username,
        first_name,
        last_name,
        subscription_type,
        role,
        email_verified,
        phone_number,
        last_login,
        created_at
      FROM users 
      WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
});

/**
 * GET /api/user/analytics
 * Get user analytics and metrics
 */
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        ua.*,
        ROUND(ua.total_time_spent_seconds::numeric / 3600, 2) as total_hours_spent
      FROM user_analytics ua
      WHERE ua.user_id = $1`,
      [req.user.userId]
    );

    // If no analytics record exists, create default one
    if (result.rows.length === 0) {
      await db.query(
        `INSERT INTO user_analytics (user_id, total_sessions, total_time_spent_seconds)
         VALUES ($1, 0, 0)`,
        [req.user.userId]
      );

      return res.json({
        success: true,
        analytics: {
          user_id: req.user.userId,
          total_sessions: 0,
          total_time_spent_seconds: 0,
          total_hours_spent: 0,
          most_used_feature: null,
          ai_queries_count: 0,
          transactions_tracked: 0,
          accounts_connected: 0,
          goals_created: 0
        }
      });
    }

    res.json({
      success: true,
      analytics: result.rows[0]
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
});

/**
 * GET /api/user/onboarding
 * Get user onboarding data
 */
router.get('/onboarding', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM user_onboarding WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        onboarding: null,
        completed: false
      });
    }

    res.json({
      success: true,
      onboarding: result.rows[0],
      completed: true
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve onboarding data'
    });
  }
});

/**
 * POST /api/user/onboarding
 * Save or update user onboarding data
 */
// Helper function to safely stringify data (handles already-stringified data)
function safeStringify(data) {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data === 'string') {
    // Already a string, return as-is
    return data;
  }
  // It's an object/array, stringify it
  try {
    return JSON.stringify(data);
  } catch (err) {
    console.error('Error stringifying data:', err);
    return null;
  }
}

router.post('/onboarding', authenticate, async (req, res) => {
  try {
    console.log('📥 Received onboarding POST request for user:', req.user.userId);
    console.log('📥 Request body keys:', Object.keys(req.body));
    
    const {
      // Legacy fields
      employment_status,
      annual_income,
      monthly_expenses,
      debt_amount,
      savings_goal,
      investment_experience,
      risk_tolerance,
      financial_goals,
      // New comprehensive fields
      purpose,
      income_source,
      monthly_takehome,
      additional_income,
      expenses,
      expense_categories,
      budget,
      subscriptions,
      assets,
      total_assets_value,
      investments,
      portfolio_value,
      debts,
      total_debt_amount,
      selected_plan,
      step4_responses,
      bank_connected,
      plaid_item_id,
      linked_accounts
    } = req.body;
    
    console.log('� Extracted Financial Data:');
    console.log('   - monthly_takehome:', monthly_takehome, '(type:', typeof monthly_takehome, ')');
    console.log('   - monthly_expenses:', monthly_expenses, '(type:', typeof monthly_expenses, ')');
    console.log('   - debt_amount:', debt_amount, '(type:', typeof debt_amount, ')');
    console.log('   - total_assets_value:', total_assets_value, '(type:', typeof total_assets_value, ')');
    console.log('   - portfolio_value:', portfolio_value, '(type:', typeof portfolio_value, ')');
    console.log('📋 Extracted Detail Data (types):');
    console.log('   - expenses type:', typeof expenses, Array.isArray(expenses) ? '(array)' : '(object)');
    console.log('   - subscriptions type:', typeof subscriptions, Array.isArray(subscriptions) ? '(array)' : '(object)');
    console.log('   - investments type:', typeof investments, Array.isArray(investments) ? '(array)' : '(object)');
    console.log('   - debts type:', typeof debts, Array.isArray(debts) ? '(array)' : '(object)');
    console.log('   - assets type:', typeof assets, Array.isArray(assets) ? '(array)' : '(object)');

    // Check if onboarding data already exists
    const existing = await db.query(
      `SELECT onboarding_id FROM user_onboarding WHERE user_id = $1`,
      [req.user.userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE user_onboarding 
         SET employment_status = $1,
             annual_income = $2,
             monthly_expenses = $3,
             debt_amount = $4,
             savings_goal = $5,
             investment_experience = $6,
             risk_tolerance = $7,
             financial_goals = $8,
             purpose = $9,
             income_source = $10,
             monthly_takehome = $11,
             additional_income = $12,
             expenses = $13,
             expense_categories = $14,
             budget = $15,
             subscriptions = $16,
             assets = $17,
             total_assets_value = $18,
             investments = $19,
             portfolio_value = $20,
             debts = $21,
             total_debt_amount = $22,
             selected_plan = $23,
             step4_responses = $24,
             bank_connected = $25,
             plaid_item_id = $26,
             linked_accounts = $27,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $28
         RETURNING *`,
        [
          employment_status,
          annual_income || (monthly_takehome ? monthly_takehome * 12 : null),
          monthly_expenses,
          debt_amount || total_debt_amount,
          savings_goal,
          investment_experience,
          risk_tolerance,
          financial_goals,
          purpose,
          income_source,
          monthly_takehome,
          safeStringify(additional_income || []),
          safeStringify(expenses || {}),
          safeStringify(expense_categories || []),
          safeStringify(budget || {}),
          safeStringify(subscriptions || []),
          safeStringify(assets || []),
          total_assets_value,
          safeStringify(investments || []),
          portfolio_value,
          safeStringify(debts || []),
          total_debt_amount,
          selected_plan,
          safeStringify(step4_responses || {}),
          bank_connected || false,
          plaid_item_id,
          safeStringify(linked_accounts || []),
          req.user.userId
        ]
      );
    } else {
      // Insert new
      result = await db.query(
        `INSERT INTO user_onboarding (
          user_id,
          employment_status,
          annual_income,
          monthly_expenses,
          debt_amount,
          savings_goal,
          investment_experience,
          risk_tolerance,
          financial_goals,
          purpose,
          income_source,
          monthly_takehome,
          additional_income,
          expenses,
          expense_categories,
          budget,
          subscriptions,
          assets,
          total_assets_value,
          investments,
          portfolio_value,
          debts,
          total_debt_amount,
          selected_plan,
          step4_responses,
          bank_connected,
          plaid_item_id,
          linked_accounts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING *`,
        [
          req.user.userId,
          employment_status,
          annual_income || (monthly_takehome ? monthly_takehome * 12 : null),
          monthly_expenses,
          debt_amount || total_debt_amount,
          savings_goal,
          investment_experience,
          risk_tolerance,
          financial_goals,
          purpose,
          income_source,
          monthly_takehome,
          safeStringify(additional_income || []),
          safeStringify(expenses || {}),
          safeStringify(expense_categories || []),
          safeStringify(budget || {}),
          safeStringify(subscriptions || []),
          safeStringify(assets || []),
          total_assets_value,
          safeStringify(investments || []),
          portfolio_value,
          safeStringify(debts || []),
          total_debt_amount,
          selected_plan,
          safeStringify(step4_responses || {}),
          bank_connected || false,
          plaid_item_id,
          safeStringify(linked_accounts || [])
        ]
      );
    }

    // Mark onboarding as completed in users table
    await db.query(
      `UPDATE users SET onboarding_completed = TRUE WHERE user_id = $1`,
      [req.user.userId]
    );

    console.log('✅ Onboarding data saved to database successfully!');
    
    // Helper function to safely parse and count array items
    const safeParseCount = (field) => {
      try {
        if (!field) return 0;
        const parsed = typeof field === 'string' ? JSON.parse(field) : field;
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch (err) {
        return 0;
      }
    };
    
    console.log('💾 Saved record:', {
      monthly_takehome: result.rows[0].monthly_takehome,
      monthly_expenses: result.rows[0].monthly_expenses,
      debt_amount: result.rows[0].debt_amount,
      total_assets_value: result.rows[0].total_assets_value,
      portfolio_value: result.rows[0].portfolio_value,
      expenses: typeof result.rows[0].expenses === 'string' ? 'JSON string (saved)' : 'Object (saved)',
      subscriptions_count: safeParseCount(result.rows[0].subscriptions),
      investments_count: safeParseCount(result.rows[0].investments),
      debts_count: safeParseCount(result.rows[0].debts),
      assets_count: safeParseCount(result.rows[0].assets)
    });

    res.json({
      success: true,
      message: 'Onboarding data saved successfully',
      onboarding: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Save onboarding error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to save onboarding data',
      error: error.message,
      errorType: error.name
    });
  }
});

/**
 * GET /api/user/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    // Get user profile
    const userResult = await db.query(
      `SELECT 
        user_id,
        email,
        username,
        first_name,
        last_name,
        subscription_type,
        created_at
      FROM users 
      WHERE user_id = $1`,
      [req.user.userId]
    );

    // Get analytics
    const analyticsResult = await db.query(
      `SELECT * FROM vw_user_overview WHERE user_id = $1`,
      [req.user.userId]
    );

    // Get onboarding data
    const onboardingResult = await db.query(
      `SELECT * FROM user_onboarding WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.userId]
    );

    // Get connected accounts count
    const accountsResult = await db.query(
      `SELECT COUNT(*) as count FROM accounts WHERE user_id = $1 AND is_active = true`,
      [req.user.userId]
    );

    // Get recent transactions
    const transactionsResult = await db.query(
      `SELECT 
        transaction_id,
        transaction_date,
        amount,
        description,
        category,
        merchant_name
      FROM transactions 
      WHERE user_id = $1 
      ORDER BY transaction_date DESC 
      LIMIT 10`,
      [req.user.userId]
    );

    res.json({
      success: true,
      dashboard: {
        user: userResult.rows[0],
        analytics: analyticsResult.rows[0] || null,
        onboarding: onboardingResult.rows[0] || null,
        accounts_connected: parseInt(accountsResult.rows[0].count),
        recent_transactions: transactionsResult.rows
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

/**
 * POST /api/user/track-session
 * Track user session start
 */
router.post('/track-session', authenticate, async (req, res) => {
  try {
    const { device_type, browser } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await db.query(
      `INSERT INTO user_sessions (
        user_id,
        session_start,
        ip_address,
        user_agent,
        device_type,
        browser
      ) VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5)
      RETURNING session_id`,
      [req.user.userId, ipAddress, userAgent, device_type, browser]
    );

    // Update last_login
    await db.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [req.user.userId]
    );

    // Record daily active user
    await db.query(
      `INSERT INTO daily_active_users (activity_date, user_id, subscription_type, session_count)
       VALUES (CURRENT_DATE, $1, $2, 1)
       ON CONFLICT (activity_date, user_id) 
       DO UPDATE SET session_count = daily_active_users.session_count + 1`,
      [req.user.userId, req.user.role]
    );

    res.json({
      success: true,
      session_id: result.rows[0].session_id
    });
  } catch (error) {
    console.error('Track session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track session'
    });
  }
});

/**
 * POST /api/user/end-session
 * End user session and calculate duration
 */
router.post('/end-session', authenticate, async (req, res) => {
  try {
    const { session_id } = req.body;

    await db.query(
      `UPDATE user_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - session_start))
       WHERE session_id = $1 AND user_id = $2`,
      [session_id, req.user.userId]
    );

    // Update user analytics
    await db.query(
      `UPDATE user_analytics 
       SET total_sessions = total_sessions + 1,
           last_active = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

/**
 * POST /api/user/track-feature
 * Track feature usage
 */
router.post('/track-feature', authenticate, async (req, res) => {
  try {
    const { feature_name, action_type, duration_seconds, metadata } = req.body;

    await db.query(
      `INSERT INTO feature_usage (
        user_id,
        feature_name,
        action_type,
        duration_seconds,
        metadata
      ) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, feature_name, action_type, duration_seconds, JSON.stringify(metadata || {})]
    );

    // Update feature adoption tracking
    await db.query(
      `INSERT INTO feature_adoption_tracking (
        user_id,
        feature_name,
        first_used_at,
        total_uses,
        last_used_at,
        user_subscription_type
      ) VALUES ($1, $2, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, $3)
      ON CONFLICT (user_id, feature_name)
      DO UPDATE SET 
        total_uses = feature_adoption_tracking.total_uses + 1,
        last_used_at = CURRENT_TIMESTAMP`,
      [req.user.userId, feature_name, req.user.role]
    );

    res.json({
      success: true,
      message: 'Feature usage tracked'
    });
  } catch (error) {
    console.error('Track feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track feature usage'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, phone_number } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET first_name = $1,
           last_name = $2,
           phone_number = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING user_id, email, username, first_name, last_name, phone_number, subscription_type`,
      [first_name, last_name, phone_number, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * GET /api/user/onboarding-data
 * Get user onboarding data for dashboard visualizations
 */
router.get('/onboarding-data', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching onboarding data for user:', req.user.userId);
    
    const result = await db.query(
      `SELECT 
        purpose,
        income_source,
        monthly_takehome,
        additional_income,
        expenses,
        expense_categories,
        subscriptions,
        assets,
        total_assets_value,
        investments,
        portfolio_value,
        debts,
        total_debt_amount,
        selected_plan
      FROM user_onboarding 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1`,
      [req.user.userId]
    );

    console.log('📊 Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('⚠️ No onboarding data found for user:', req.user.userId);
      console.log('🔍 Checking if user exists in database...');
      const userCheck = await db.query('SELECT user_id FROM users WHERE user_id = $1', [req.user.userId]);
      console.log('👤 User exists:', userCheck.rows.length > 0);
      
      return res.json({
        success: true,
        data: null,
        message: 'No onboarding data found. Please complete the onboarding process.'
      });
    }

    const onboardingData = result.rows[0];
    console.log('✅ Raw data from DB:', JSON.stringify(onboardingData, null, 2));
    console.log('✅ monthly_takehome type:', typeof onboardingData.monthly_takehome);
    console.log('✅ expenses type:', typeof onboardingData.expenses);
    
    res.json(onboardingData);
  } catch (error) {
    console.error('❌ Get onboarding data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve onboarding data',
      error: error.message
    });
  }
});

/**
 * GET /api/user/monthly-financials
 * Get monthly financial data (income/expenses) for interactive chart
 */
router.get('/monthly-financials', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT month, year, income, expenses, notes
       FROM user_monthly_financials 
       WHERE user_id = $1 
       ORDER BY year DESC, month DESC
       LIMIT 12`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get monthly financials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly financial data'
    });
  }
});

/**
 * POST /api/user/monthly-financials
 * Save or update monthly financial data for a specific month/year
 */
router.post('/monthly-financials', authenticate, async (req, res) => {
  try {
    const { month, year, income, expenses, notes } = req.body;

    // Validate input
    if (!month || !year || income === undefined || expenses === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, income, and expenses are required'
      });
    }

    // Upsert (insert or update if exists)
    const result = await db.query(
      `INSERT INTO user_monthly_financials (user_id, month, year, income, expenses, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, month, year) 
       DO UPDATE SET 
         income = EXCLUDED.income,
         expenses = EXCLUDED.expenses,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [req.user.userId, month, year, income, expenses, notes || null]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Monthly financial data saved successfully'
    });
  } catch (error) {
    console.error('Save monthly financials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly financial data'
    });
  }
});

/**
 * DELETE /api/user/monthly-financials/:month/:year
 * Delete monthly financial data for a specific month/year
 */
router.delete('/monthly-financials/:month/:year', authenticate, async (req, res) => {
  try {
    const { month, year } = req.params;

    const result = await db.query(
      `DELETE FROM user_monthly_financials 
       WHERE user_id = $1 AND month = $2 AND year = $3
       RETURNING *`,
      [req.user.userId, month, year]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Monthly financial data not found'
      });
    }

    res.json({
      success: true,
      message: 'Monthly financial data deleted successfully'
    });
  } catch (error) {
    console.error('Delete monthly financials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete monthly financial data'
    });
  }
});

/**
 * GET /api/subscriptions/search
 * Search for subscriptions by query
 */
router.get('/subscriptions/search', authenticate, async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    
    // Hardcoded subscription database (in production, this would be from a database)
    const subscriptions = [
      { name: 'Netflix', cost: 15.99, category: 'entertainment' },
      { name: 'Spotify Premium', cost: 10.99, category: 'entertainment' },
      { name: 'Amazon Prime', cost: 14.99, category: 'shopping' },
      { name: 'Apple Music', cost: 10.99, category: 'entertainment' },
      { name: 'Disney+', cost: 10.99, category: 'entertainment' },
      { name: 'Hulu', cost: 7.99, category: 'entertainment' },
      { name: 'HBO Max', cost: 15.99, category: 'entertainment' },
      { name: 'YouTube Premium', cost: 11.99, category: 'entertainment' },
      { name: 'Audible', cost: 14.95, category: 'entertainment' },
      { name: 'Adobe Creative Cloud', cost: 52.99, category: 'other' },
      { name: 'Microsoft 365', cost: 69.99, category: 'other' },
      { name: 'Dropbox', cost: 9.99, category: 'other' },
      { name: 'Evernote', cost: 7.99, category: 'other' },
      { name: 'Grammarly', cost: 11.99, category: 'other' },
      { name: 'Canva Pro', cost: 12.99, category: 'other' },
      { name: 'Figma', cost: 144, category: 'other' },
      { name: 'Slack', cost: 8.75, category: 'other' },
      { name: 'Zoom Pro', cost: 14.99, category: 'other' },
      { name: 'LinkedIn Premium', cost: 29.99, category: 'other' },
      { name: 'Coursera Plus', cost: 59, category: 'other' }
    ];
    
    const filtered = subscriptions.filter(sub => 
      sub.name.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
    
    res.json(filtered);
  } catch (error) {
    console.error('Search subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search subscriptions'
    });
  }
});

module.exports = router;
