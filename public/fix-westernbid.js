// Temporary fix for WesternBid auto-submit
console.log('WesternBid fix script loaded');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for WesternBid form...');
    
    // Look for WesternBid form
    const form = document.getElementById('westernbid-form');
    
    if (form) {
        console.log('WesternBid form found, setting up auto-submit...');
        
        // Add a visible submit button as backup
        const submitButton = document.createElement('button');
        submitButton.innerHTML = '🚀 Continue to Payment Gateway';
        submitButton.style.cssText = `
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            margin: 20px;
            display: block;
            width: 300px;
            margin: 20px auto;
            transition: transform 0.2s;
        `;
        
        submitButton.onmouseover = function() {
            this.style.transform = 'scale(1.05)';
        };
        
        submitButton.onmouseout = function() {
            this.style.transform = 'scale(1)';
        };
        
        submitButton.onclick = function(e) {
            e.preventDefault();
            console.log('Manual submit triggered');
            submitWesternBidForm();
        };
        
        // Insert button after the debug info
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.parentNode.insertBefore(submitButton, debugInfo.nextSibling);
        }
        
        // Auto-submit after 3 seconds
        setTimeout(function() {
            console.log('Auto-submit triggered after 3 seconds');
            submitWesternBidForm();
        }, 3000);
        
    } else {
        console.log('WesternBid form not found on this page');
    }
});

function submitWesternBidForm() {
    const form = document.getElementById('westernbid-form');
    if (form) {
        console.log('Submitting WesternBid form...');
        
        // Update status if available
        const status = document.querySelector('.container p');
        if (status) {
            status.textContent = 'Redirecting to WesternBid payment gateway...';
        }
        
        try {
            form.submit();
        } catch (error) {
            console.error('Form submission failed:', error);
            alert('Payment redirect failed. Please try again or contact support.');
        }
    } else {
        console.error('WesternBid form not found for submission');
        alert('Payment form not ready. Please refresh the page and try again.');
    }
}