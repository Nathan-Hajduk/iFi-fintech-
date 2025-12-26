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
router.post('/onboarding', authenticate, async (req, res) => {
  try {
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
             subscriptions = $15,
             assets = $16,
             total_assets_value = $17,
             investments = $18,
             portfolio_value = $19,
             debts = $20,
             total_debt_amount = $21,
             selected_plan = $22,
             step4_responses = $23,
             bank_connected = $24,
             plaid_item_id = $25,
             linked_accounts = $26,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $27
         RETURNING *`,
        [
          employment_status,
          annual_income || monthly_takehome * 12,
          monthly_expenses,
          debt_amount || total_debt_amount,
          savings_goal,
          investment_experience,
          risk_tolerance,
          financial_goals,
          purpose,
          income_source,
          monthly_takehome,
          JSON.stringify(additional_income || []),
          JSON.stringify(expenses || {}),
          JSON.stringify(expense_categories || []),
          JSON.stringify(subscriptions || []),
          JSON.stringify(assets || []),
          total_assets_value,
          JSON.stringify(investments || []),
          portfolio_value,
          JSON.stringify(debts || []),
          total_debt_amount,
          selected_plan,
          JSON.stringify(step4_responses || {}),
          bank_connected || false,
          plaid_item_id,
          JSON.stringify(linked_accounts || []),
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING *`,
        [
          req.user.userId,
          employment_status,
          annual_income || monthly_takehome * 12,
          monthly_expenses,
          debt_amount || total_debt_amount,
          savings_goal,
          investment_experience,
          risk_tolerance,
          financial_goals,
          purpose,
          income_source,
          monthly_takehome,
          JSON.stringify(additional_income || []),
          JSON.stringify(expenses || {}),
          JSON.stringify(expense_categories || []),
          JSON.stringify(subscriptions || []),
          JSON.stringify(assets || []),
          total_assets_value,
          JSON.stringify(investments || []),
          portfolio_value,
          JSON.stringify(debts || []),
          total_debt_amount,
          selected_plan,
          JSON.stringify(step4_responses || {}),
          bank_connected || false,
          plaid_item_id,
          JSON.stringify(linked_accounts || [])
        ]
      );
    }

    // Mark onboarding as completed in users table
    await db.query(
      `UPDATE users SET onboarding_completed = TRUE WHERE user_id = $1`,
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Onboarding data saved successfully',
      onboarding: result.rows[0]
    });
  } catch (error) {
    console.error('Save onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save onboarding data',
      error: error.message
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

module.exports = router;
