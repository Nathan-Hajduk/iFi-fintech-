/**
 * AI Advisor API Routes
 * Endpoints for financial advice powered by OpenAI
 */

const express = require('express');
const router = express.Router();
const aiAdvisor = require('../services/ai-advisor');
const { authenticate, requirePremium } = require('../middleware/auth');
const db = require('../config/database');

/**
 * POST /api/ifi-ai/chat
 * Get AI financial advice
 * Requires: Premium subscription
 */
router.post('/chat', authenticate, requirePremium, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Get user's financial data
    const userData = await getUserFinancialData(req.user.userId);
    
    // Get AI response
    const response = await aiAdvisor.getAdvice(message, userData, conversationHistory);
    
    // Save conversation to database
    await saveConversation(req.user.userId, message, response);
    
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response'
    });
  }
});

/**
 * POST /api/ifi-ai/chat/stream
 * Get streaming AI response
 * Requires: Premium subscription
 */
router.post('/chat/stream', authenticate, requirePremium, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Get user's financial data
    const userData = await getUserFinancialData(req.user.userId);
    
    let fullResponse = '';
    
    // Stream AI response
    for await (const chunk of aiAdvisor.getAdviceStream(message, userData, conversationHistory)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    // Send end marker
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    
    // Save conversation to database
    await saveConversation(req.user.userId, message, fullResponse);
    
    res.end();
  } catch (error) {
    console.error('AI chat stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/ifi-ai/quick-tip
 * Get personalized financial tip
 * Requires: Premium subscription
 */
router.get('/quick-tip', authenticate, requirePremium, async (req, res) => {
  try {
    const userData = await getUserFinancialData(req.user.userId);
    const tip = await aiAdvisor.getQuickTip(userData);
    
    res.json({
      success: true,
      tip: tip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quick tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial tip'
    });
  }
});

/**
 * POST /api/ifi-ai/analyze-spending
 * Analyze spending patterns
 * Requires: Premium subscription
 */
router.post('/analyze-spending', authenticate, requirePremium, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Get transactions for date range
    const transactions = await getUserTransactions(req.user.userId, startDate, endDate);
    
    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found for the specified date range'
      });
    }
    
    // Analyze spending
    const analysis = await aiAdvisor.analyzeSpending(transactions);
    
    res.json({
      success: true,
      ...analysis,
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error('Spending analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze spending'
    });
  }
});

/**
 * POST /api/ifi-ai/portfolio-recommendations
 * Get portfolio rebalancing recommendations
 * Requires: Premium subscription
 */
router.post('/portfolio-recommendations', authenticate, requirePremium, async (req, res) => {
  try {
    const userData = await getUserFinancialData(req.user.userId);
    const portfolio = await getUserPortfolio(req.user.userId);
    
    if (!portfolio || portfolio.holdings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No investment portfolio found'
      });
    }
    
    const recommendations = await aiAdvisor.getPortfolioRecommendations(portfolio, userData);
    
    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Portfolio recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio recommendations'
    });
  }
});

/**
 * GET /api/ifi-ai/conversation-history
 * Get user's conversation history
 */
router.get('/conversation-history', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await db.query(
      `SELECT id, message, response, created_at 
       FROM ai_conversations 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.userId, limit, offset]
    );
    
    res.json({
      success: true,
      conversations: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Conversation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history'
    });
  }
});

/**
 * DELETE /api/ifi-ai/conversation-history
 * Clear user's conversation history
 */
router.delete('/conversation-history', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM ai_conversations WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history'
    });
  }
});

// Helper functions

/**
 * Get user's financial data for AI context
 */
async function getUserFinancialData(userId) {
  try {
    // Get user profile
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    // Get net worth (simplified - would calculate from actual data)
    const netWorthResult = await db.query(
      'SELECT SUM(balance) as total FROM accounts WHERE user_id = $1',
      [userId]
    );
    const netWorth = netWorthResult.rows[0]?.total || 0;
    
    // Get monthly income/expenses (from last 30 days)
    const cashFlowResult = await db.query(
      `SELECT 
         SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
       FROM transactions 
       WHERE user_id = $1 
       AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId]
    );
    const { income = 0, expenses = 0 } = cashFlowResult.rows[0] || {};
    
    // Get investments
    const investmentsResult = await db.query(
      'SELECT symbol, name, shares, current_price, shares * current_price as value FROM holdings WHERE user_id = $1',
      [userId]
    );
    const investments = investmentsResult.rows.map(inv => ({
      name: inv.name || inv.symbol,
      value: parseFloat(inv.value),
      type: 'stock' // Simplified
    }));
    
    // Get debts
    const debtsResult = await db.query(
      'SELECT name, balance, interest_rate FROM debts WHERE user_id = $1',
      [userId]
    );
    const debts = debtsResult.rows.map(debt => ({
      name: debt.name,
      balance: parseFloat(debt.balance),
      interestRate: parseFloat(debt.interest_rate)
    }));
    
    // Get goals
    const goalsResult = await db.query(
      'SELECT name, target_amount, target_date FROM goals WHERE user_id = $1',
      [userId]
    );
    const goals = goalsResult.rows.map(goal => ({
      name: goal.name,
      targetAmount: parseFloat(goal.target_amount),
      targetDate: goal.target_date
    }));
    
    return {
      netWorth: parseFloat(netWorth),
      income: parseFloat(income),
      expenses: parseFloat(expenses),
      investments,
      debts,
      goals,
      riskTolerance: user.risk_tolerance || 'moderate',
      age: user.age || null
    };
  } catch (error) {
    console.error('Get user financial data error:', error);
    // Return minimal data if query fails
    return {
      netWorth: 0,
      income: 0,
      expenses: 0,
      investments: [],
      debts: [],
      goals: [],
      riskTolerance: 'moderate'
    };
  }
}

/**
 * Get user's transactions for date range
 */
async function getUserTransactions(userId, startDate, endDate) {
  try {
    const result = await db.query(
      `SELECT category, ABS(amount) as amount 
       FROM transactions 
       WHERE user_id = $1 
       AND amount < 0 
       AND created_at >= $2 
       AND created_at <= $3`,
      [userId, startDate || new Date(Date.now() - 30*24*60*60*1000), endDate || new Date()]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
}

/**
 * Get user's investment portfolio
 */
async function getUserPortfolio(userId) {
  try {
    const result = await db.query(
      'SELECT symbol, shares, current_price, shares * current_price as total_value FROM holdings WHERE user_id = $1',
      [userId]
    );
    
    const holdings = result.rows.map(row => ({
      symbol: row.symbol,
      shares: parseFloat(row.shares),
      currentPrice: parseFloat(row.current_price),
      totalValue: parseFloat(row.total_value)
    }));
    
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    
    return {
      holdings,
      totalValue
    };
  } catch (error) {
    console.error('Get portfolio error:', error);
    return null;
  }
}

/**
 * Save conversation to database
 */
async function saveConversation(userId, message, response) {
  try {
    await db.query(
      'INSERT INTO ai_conversations (user_id, message, response, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, message, response]
    );
  } catch (error) {
    console.error('Save conversation error:', error);
    // Don't throw - conversation saving is non-critical
  }
}

module.exports = router;
