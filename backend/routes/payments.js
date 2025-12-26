/**
 * Payment Routes for iFi
 * Handles PayPal payment processing for subscriptions
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// PayPal SDK configuration
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  // Use sandbox for testing, live for production
  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

// PayPal client
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

/**
 * POST /api/payments/create-order
 * Create PayPal order for subscription
 */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    console.log('Create order request received');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const { plan } = req.body; // 'monthly' or 'annual'
    
    if (!plan || (plan !== 'monthly' && plan !== 'annual')) {
      console.log('Invalid plan:', plan);
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }
    
    // Define plan prices
    const prices = {
      monthly: {
        amount: '9.99',
        description: 'iFi+ Monthly Subscription'
      },
      annual: {
        amount: '95.88',
        description: 'iFi+ Annual Subscription'
      }
    };
    
    const planDetails = prices[plan];
    console.log('Plan details:', planDetails);
    
    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        description: planDetails.description,
        amount: {
          currency_code: 'USD',
          value: planDetails.amount
        }
      }],
      application_context: {
        brand_name: 'iFi',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_URL}/html/onboarding.html?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/html/onboarding.html?payment=cancelled`
      }
    });
    
    console.log('Calling PayPal API...');
    const order = await client().execute(request);
    console.log('PayPal order created:', order.result.id);
    
    // Store pending payment in database
    await db.query(
      `INSERT INTO payment_transactions (
        user_id, 
        order_id, 
        plan_type, 
        amount, 
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [req.user.userId, order.result.id, plan, planDetails.amount, 'pending']
    );
    
    console.log('Payment transaction stored in database');
    
    res.json({
      success: true,
      orderId: order.result.id
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

/**
 * POST /api/payments/capture-order
 * Capture PayPal order after user approval
 */
router.post('/capture-order', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // Capture the order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await client().execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Get payment details from database
      const paymentResult = await db.query(
        `SELECT plan_type, amount FROM payment_transactions 
         WHERE order_id = $1 AND user_id = $2`,
        [orderId, req.user.userId]
      );
      
      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment transaction not found'
        });
      }
      
      const { plan_type } = paymentResult.rows[0];
      
      // Update payment status
      await db.query(
        `UPDATE payment_transactions 
         SET status = 'completed', 
             completed_at = CURRENT_TIMESTAMP,
             transaction_data = $1
         WHERE order_id = $2`,
        [JSON.stringify(capture.result), orderId]
      );
      
      // Update user subscription
      const subscriptionType = plan_type === 'monthly' ? 'ifi_plus' : 'ifi_plus';
      const billingCycle = plan_type;
      const nextBillingDate = new Date();
      
      if (plan_type === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }
      
      await db.query(
        `UPDATE users 
         SET subscription_type = $1,
             role = $1,
             subscription_start_date = CURRENT_TIMESTAMP,
             subscription_end_date = $2,
             billing_cycle = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [subscriptionType, nextBillingDate, billingCycle, req.user.userId]
      );
      
      res.json({
        success: true,
        message: 'Payment completed successfully',
        capture: capture.result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment capture failed',
        status: capture.result.status
      });
    }
    
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture payment',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        transaction_id,
        order_id,
        plan_type,
        amount,
        status,
        created_at,
        completed_at
       FROM payment_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    
    res.json({
      success: true,
      payments: result.rows
    });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history'
    });
  }
});

module.exports = router;
