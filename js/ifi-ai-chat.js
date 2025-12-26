/**
 * iFi AI Chat Integration
 * Connects frontend chat UI to backend AI API with premium gating
 */

class IFiAIChat {
  constructor() {
    this.conversationHistory = [];
    this.messageContainer = null;
    this.inputElement = null;
    this.sendButton = null;
    this.isProcessing = false;
    this.userSubscription = null;
  }

  /**
   * Initialize the chat system
   */
  async init() {
    // Get DOM elements
    this.messageContainer = document.getElementById('chatMessages');
    this.inputElement = document.getElementById('chatInput');
    this.sendButton = document.querySelector('.send-btn');

    if (!this.messageContainer || !this.inputElement || !this.sendButton) {
      console.error('Required DOM elements not found');
      return;
    }

    // Check user subscription status
    await this.checkSubscriptionStatus();

    // Load conversation history
    await this.loadConversationHistory();

    // Set up event listeners
    this.setupEventListeners();

    console.log('iFi AI Chat initialized');
  }

  /**
   * Check if user has premium subscription
   */
  async checkSubscriptionStatus() {
    try {
      if (!window.authManager || !authManager.isAuthenticated()) {
        this.showLoginRequired();
        return;
      }

      const response = await authManager.fetch('/api/auth/me');
      const data = await response.json();
      
      this.userSubscription = data.user?.subscription_type || 'free';
      
      if (this.userSubscription === 'free') {
        this.showPremiumGate();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      this.userSubscription = 'free';
      this.showPremiumGate();
    }
  }

  /**
   * Show login required message for unauthenticated users
   */
  showLoginRequired() {
    this.messageContainer.innerHTML = `
      <div class="premium-gate">
        <div class="gate-icon"><i class="fas fa-lock"></i></div>
        <h3>Login Required</h3>
        <p>Please log in to access iFi AI and start your financial journey.</p>
        <a href="Login.html" class="cta-button">Log In</a>
      </div>
    `;
    this.inputElement.disabled = true;
    this.sendButton.disabled = true;
  }

  /**
   * Show premium upgrade prompt for free users
   */
  showPremiumGate() {
    const gateMessage = document.createElement('div');
    gateMessage.className = 'message premium-gate-message';
    gateMessage.innerHTML = `
      <div class="premium-gate-content">
        <div class="gate-icon"><i class="fas fa-crown"></i></div>
        <h3>Unlock iFi AI with iFi+</h3>
        <p><strong>Free users</strong> can ask pre-made questions below.</p>
        <p><strong>iFi+ members</strong> get unlimited custom conversations with your personal AI financial advisor.</p>
        <a href="pricing.html" class="cta-button" style="display: inline-block; margin-top: 1rem;">Upgrade to iFi+</a>
        
        <div class="faq-prompts" style="margin-top: 2rem;">
          <h4>Try these questions:</h4>
          <button class="faq-btn" onclick="ifiAI.askFAQ('How do I start investing?')">
            How do I start investing?
          </button>
          <button class="faq-btn" onclick="ifiAI.askFAQ('What are stocks and how do they work?')">
            What are stocks?
          </button>
          <button class="faq-btn" onclick="ifiAI.askFAQ('How should I plan for retirement?')">
            How should I plan for retirement?
          </button>
          <button class="faq-btn" onclick="ifiAI.askFAQ('Should I invest in cryptocurrency?')">
            Should I invest in crypto?
          </button>
        </div>
      </div>
    `;
    this.messageContainer.appendChild(gateMessage);
    
    // Disable custom input for free users
    this.inputElement.placeholder = "Upgrade to iFi+ for unlimited custom questions...";
    this.inputElement.disabled = true;
    this.sendButton.disabled = true;
  }

  /**
   * Handle pre-made FAQ for free users
   */
  async askFAQ(question) {
    const faqResponses = {
      'How do I start investing?': `Great question! Starting to invest is easier than you think. Here's a roadmap:\n\n**Step 1: Build Your Foundation**\n• Create an emergency fund (3-6 months of expenses)\n• Pay off high-interest debt (credit cards)\n• Understand your risk tolerance\n\n**Step 2: Choose Your Investment Vehicle**\n• 401(k) - Start here if your employer offers matching\n• IRA (Traditional or Roth) - Tax-advantaged retirement accounts\n• Taxable brokerage - For flexible long-term investing\n\n**Step 3: Select Your Investments**\n• Index Funds/ETFs - Best for beginners (S&P 500)\n• Target-Date Funds - Automatic diversification\n• Start small - Even $50-100/month makes a difference\n\n**Step 4: Automate & Stay Consistent**\n• Set up automatic monthly contributions\n• Invest for the long term (10+ years)\n• Time in the market beats timing the market!\n\n💡 *Want personalized advice based on your actual finances? Upgrade to iFi+ for unlimited AI conversations!*`,
      
      'What are stocks and how do they work?': `Stocks represent ownership in a company. When you buy shares, you become a partial owner!\n\n**How Stocks Make Money:**\n1. Capital Appreciation - Buy low, sell high\n2. Dividends - Quarterly cash payments from profits\n\n**How Prices Work:**\n• Determined by supply and demand\n• Influenced by company performance and market sentiment\n• Trade on exchanges (NYSE, NASDAQ)\n\n**Types of Stocks:**\n• Growth stocks - High potential, higher risk\n• Value stocks - Undervalued, steady growth\n• Dividend stocks - Regular income\n• Blue-chip stocks - Large, stable companies\n\n**Risk vs. Reward:**\nStocks are riskier than bonds but offer higher long-term returns (~10% average annually).\n\n💡 *Upgrade to iFi+ to get AI analysis of your specific portfolio and personalized stock recommendations!*`,
      
      'How should I plan for retirement?': `Smart retirement planning starts now! Here's your roadmap:\n\n**Retirement Accounts:**\n• 401(k) - Contribute enough for full employer match\n• IRA - Traditional (tax now) or Roth (tax-free later)\n• 2024 limits: $23,000 (401k), $7,000 (IRA)\n\n**How Much Do You Need?**\n• Rule of thumb: 70-80% of pre-retirement income\n• 4% rule: Save 25x your annual expenses\n• Example: Need $60k/year → Save $1.5M\n\n**Savings Plan:**\n• Save 15-20% of gross income\n• Max employer match first\n• Then max Roth IRA\n• Then increase 401(k)\n\n**Investment Strategy by Age:**\n• 20s-30s: 90% stocks, 10% bonds\n• 40s-50s: 70% stocks, 30% bonds\n• 60s+: 50% stocks, 50% bonds\n\n💡 *Want a personalized retirement plan? iFi+ calculates exactly how much you need to save based on your goals!*`,
      
      'Should I invest in cryptocurrency?': `Cryptocurrency is high-risk, high-reward. Here's the honest truth:\n\n**What Is Crypto?**\n• Digital currency using blockchain\n• Decentralized (no banks/governments)\n• Bitcoin, Ethereum, and 20,000+ other coins\n\n**Pros:**\n✓ Massive growth potential\n✓ Innovation in DeFi and smart contracts\n✓ Hedge against traditional finance\n\n**Cons:**\n✗ Extreme volatility (50%+ swings)\n✗ No intrinsic value or cash flow\n✗ Regulatory uncertainty\n✗ Security risks and scams\n\n**My Recommendation:**\n• Only 5-10% of portfolio maximum\n• Stick to Bitcoin and Ethereum\n• Use reputable exchanges (Coinbase, Kraken)\n• Only invest what you can afford to lose\n\n**Bottom Line:** Crypto is speculative, not a retirement plan. Focus on traditional investments first.\n\n💡 *iFi+ members get real-time crypto analysis and portfolio diversification recommendations!*`
    };

    const response = faqResponses[question] || "I don't have a pre-made answer for that. Upgrade to iFi+ to ask any question!";
    
    // Add user message
    this.addMessage(question, 'user');
    
    // Simulate typing delay
    await this.sleep(1000);
    
    // Add AI response
    this.addMessage(response, 'assistant');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Send button click
    this.sendButton.addEventListener('click', () => this.sendMessage());

    // Enter key to send
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  /**
   * Load conversation history from backend
   */
  async loadConversationHistory() {
    if (this.userSubscription !== 'premium' && this.userSubscription !== 'ifi_plus') {
      return; // Free users don't have history
    }

    try {
      const response = await authManager.fetch('/api/ifi-ai/conversation-history');
      const data = await response.json();

      if (data.success && data.history) {
        this.conversationHistory = data.history;
        
        // Display last 10 messages
        const recentMessages = data.history.slice(-10);
        recentMessages.forEach(msg => {
          this.addMessage(msg.message_content, msg.message_role, false);
        });
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  /**
   * Send message to AI
   */
  async sendMessage() {
    const message = this.inputElement.value.trim();
    
    if (!message || this.isProcessing) return;

    // Check if premium user
    if (this.userSubscription !== 'premium' && this.userSubscription !== 'ifi_plus') {
      this.showUpgradeModal();
      return;
    }

    // Add user message to UI
    this.addMessage(message, 'user');
    this.inputElement.value = '';
    this.isProcessing = true;
    this.sendButton.disabled = true;

    // Show typing indicator
    const typingIndicator = this.addTypingIndicator();

    try {
      // Send to backend
      const response = await authManager.fetch('/api/ifi-ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages for context
        })
      });

      const data = await response.json();

      // Remove typing indicator
      typingIndicator.remove();

      if (data.success) {
        // Add AI response
        this.addMessage(data.response, 'assistant');
        
        // Update history
        this.conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: data.response }
        );
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      typingIndicator.remove();
      console.error('Chat error:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
      this.isProcessing = false;
      this.sendButton.disabled = false;
      this.inputElement.focus();
    }
  }

  /**
   * Add message to chat UI
   */
  addMessage(content, role, scrollToBottom = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const formattedContent = this.formatMessage(content);
    
    if (role === 'user') {
      messageDiv.innerHTML = `
        <div class="message-content">${formattedContent}</div>
        <div class="message-avatar"><i class="fas fa-user"></i></div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">${formattedContent}</div>
      `;
    }

    this.messageContainer.appendChild(messageDiv);
    
    if (scrollToBottom) {
      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    return messageDiv;
  }

  /**
   * Format message content (markdown-like)
   */
  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '<li style="margin-left: 1.5rem;">')
      .replace(/💡/g, '<span style="font-size: 1.2em;">💡</span>');
  }

  /**
   * Add typing indicator
   */
  addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message ai-message typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    this.messageContainer.appendChild(indicator);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    return indicator;
  }

  /**
   * Show upgrade modal
   */
  showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <button class="modal-close" onclick="this.closest('.upgrade-modal').remove()">
          <i class="fas fa-times"></i>
        </button>
        <div class="modal-icon"><i class="fas fa-crown"></i></div>
        <h3>Unlock Unlimited AI Conversations</h3>
        <p>Free users can only ask pre-made questions. Upgrade to iFi+ to:</p>
        <ul style="text-align: left; margin: 1.5rem auto; max-width: 400px;">
          <li>Ask unlimited custom questions</li>
          <li>Get personalized financial advice 24/7</li>
          <li>Receive AI analysis of your actual finances</li>
          <li>Access advanced analytics and forecasting</li>
        </ul>
        <div class="pricing-options" style="margin: 2rem 0;">
          <p style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">
            $14.99/month or $143.88/year
          </p>
          <p style="color: #10b981; font-weight: 600;">Save $36 with annual billing</p>
        </div>
        <a href="pricing.html" class="cta-button" style="padding: 1rem 2rem; font-size: 1.1rem;">
          Upgrade to iFi+
        </a>
        <button class="text-button" onclick="this.closest('.upgrade-modal').remove()" style="margin-top: 1rem;">
          Maybe Later
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Utility: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize when DOM is ready
let ifiAI;
document.addEventListener('DOMContentLoaded', async () => {
  ifiAI = new IFiAIChat();
  await ifiAI.init();
});

// Expose for FAQ buttons
window.ifiAI = ifiAI;
