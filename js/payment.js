/**
 * iFi Payment Integration
 * Handles PayPal payment processing for subscriptions
 */

// Note: API_URL is defined in onboarding.js

// Initialize PayPal payment modal
function initializePayment(planType, planName, amount) {
    // Show payment modal
    const modal = document.getElementById('payment-modal');
    if (!modal) {
        createPaymentModal();
    }
    
    // Update modal content
    document.getElementById('payment-plan-name').textContent = planName;
    document.getElementById('payment-amount').textContent = `$${amount}`;
    document.getElementById('selected-plan-type').value = planType;
    
    // Show modal
    document.getElementById('payment-modal').style.display = 'flex';
    
    // Initialize PayPal buttons if not already done
    if (!window.paypalButtonsRendered) {
        renderPayPalButtons();
    }
}

// Create payment modal HTML
function createPaymentModal() {
    const modalHTML = `
        <div id="payment-modal" class="payment-modal">
            <div class="payment-modal-content">
                <button class="payment-close" onclick="closePaymentModal()">&times;</button>
                
                <div class="payment-header">
                    <h2>Complete Your Purchase</h2>
                    <div class="payment-plan-info">
                        <p><strong id="payment-plan-name"></strong></p>
                        <p class="payment-price"><span id="payment-amount"></span></p>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <p class="payment-subtitle">Choose your payment method:</p>
                    <div id="paypal-button-container"></div>
                </div>
                
                <input type="hidden" id="selected-plan-type" value="">
                
                <div class="payment-security">
                    <i class="fas fa-lock"></i>
                    <span>Secure payment powered by PayPal</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Render PayPal buttons
function renderPayPalButtons() {
    if (!window.paypal) {
        console.error('PayPal SDK not loaded');
        showError('Payment system not available. Please refresh and try again.');
        return;
    }
    
    // Check if API_URL is defined
    if (typeof API_URL === 'undefined') {
        console.error('API_URL is not defined. Make sure onboarding.js is loaded before payment.js');
        showError('Payment system configuration error. Please refresh the page.');
        return;
    }
    
    window.paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay'
        },
        
        // Create order on backend
        createOrder: async function() {
            try {
                const planType = document.getElementById('selected-plan-type').value;
                
                if (!planType) {
                    throw new Error('No plan selected');
                }
                
                if (!authManager || !authManager.accessToken) {
                    throw new Error('Not authenticated. Please log in again.');
                }
                
                const accessToken = authManager.accessToken;
                
                console.log('Creating PayPal order for plan:', planType);
                console.log('API URL:', `${API_URL}/payments/create-order`);
                console.log('Has auth token:', !!accessToken);
                
                const response = await fetch(`${API_URL}/payments/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ plan: planType })
                });
                
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || data.error || `HTTP ${response.status}`);
                }
                
                if (!data.success || !data.orderId) {
                    throw new Error(data.message || 'No order ID returned');
                }
                
                console.log('Order ID received:', data.orderId);
                return data.orderId;
                
            } catch (error) {
                console.error('Create order error:', error);
                showError(`Failed to initiate payment: ${error.message}`);
                // Return a rejected promise to properly handle the error in PayPal
                return Promise.reject(error);
            }
        },
        
        // Capture order on backend after approval
        onApprove: async function(data) {
            try {
                const accessToken = authManager.accessToken;
                
                const response = await fetch(`${API_URL}/payments/capture-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ orderId: data.orderID })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess('Payment successful! Your subscription is now active.');
                    closePaymentModal();
                    
                    // Complete onboarding after successful payment
                    setTimeout(() => {
                        window.location.href = '../html/dashboard.html';
                    }, 2000);
                } else {
                    throw new Error(result.message);
                }
                
            } catch (error) {
                console.error('Capture order error:', error);
                showError('Payment processing failed. Please contact support.');
            }
        },
        
        onError: function(err) {
            console.error('PayPal error:', err);
            showError('An error occurred with PayPal. Please try again.');
        },
        
        onCancel: function() {
            showError('Payment cancelled. You can try again anytime.');
            closePaymentModal();
        }
        
    }).render('#paypal-button-container');
    
    window.paypalButtonsRendered = true;
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const existing = document.querySelector('.payment-message');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'payment-message error';
    banner.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(231,76,60,0.4);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
    `;
    
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const existing = document.querySelector('.payment-message');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'payment-message success';
    banner.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(46,204,113,0.4);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
    `;
    
    document.body.appendChild(banner);
}
