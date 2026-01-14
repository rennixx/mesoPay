// --- Session Loading (Multi-Merchant Support) ---
async function loadSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId) {
        try {
            const response = await fetch(`/api/session/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                const { storeName, storeIcon, orderId, amount, currency } = data.session;

                // Update Store Name
                document.querySelector('.order-header h1').textContent = storeName;

                // Update Order ID
                document.querySelector('.order-ref').textContent = `Order #${orderId}`;

                // Update Amount Display
                document.querySelector('.currency').textContent = currency;
                document.querySelector('.amount').textContent = amount.toLocaleString();

                // Update Pay Button Text
                document.querySelectorAll('.pay-button .btn-text').forEach(btn => {
                    btn.textContent = `Pay ${currency} ${amount.toLocaleString()}`;
                });

                // Store amount for payment
                window.paymentAmount = amount;

                console.log('✅ Session loaded:', storeName);
            } else {
                console.error('Session error:', data.error);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }
}

// Load session on page load
loadSession();

// --- Tabs Logic ---
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Add active to clicked
        tab.classList.add('active');
        const targetId = tab.dataset.tab + '-tab';
        document.getElementById(targetId).classList.add('active');
    });
});

// --- Wallet Selection Logic ---
const walletInputs = document.querySelectorAll('input[name="provider"]');
const selectedLogo = document.getElementById('selected-logo');
const qrPlaceholder = document.querySelector('.qr-placeholder');

// Initialize with default check
updateWalletUI('fastpay');

walletInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        updateWalletUI(e.target.value);
    });
});

function updateWalletUI(provider) {
    // 1. Update branding
    if (provider === 'fastpay') {
        selectedLogo.src = 'assets/fastpay_logo.png';
    } else if (provider === 'fib') {
        selectedLogo.src = 'assets/fib_logo.png';
    }

    // 2. Start Shimmer
    qrPlaceholder.innerHTML = '<div class="shimmer"></div>';

    // 3. Generate QR Code URL
    // For demo, we point to real websites:
    let qrTarget = "";
    if (provider === 'fastpay') {
        qrTarget = "https://fast-pay.iq"; // Real site
    } else {
        qrTarget = "https://fib.iq"; // Real site
    }

    // We use a public QR generator API for the demo
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTarget)}`;

    // 4. Load Image with Fade-in
    const img = new Image();
    img.src = qrApiUrl;
    img.className = 'qr-code-img';

    img.onload = () => {
        // Clear shimmer and append image
        qrPlaceholder.innerHTML = '';
        qrPlaceholder.appendChild(img);
        // Force reflow for transition
        setTimeout(() => img.classList.add('loaded'), 50);
    };
}

// --- Modal Logic ---
const statusModal = document.getElementById('statusModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalIcon = document.getElementById('modalIcon');
const modalBtn = document.getElementById('modalBtn');
const modalContent = document.querySelector('.modal-content');

function showModal(type, title, message, onClose = null) {
    // 1. Reset Classes
    modalContent.classList.remove('status-success', 'status-error', 'status-loading');

    // 2. Set Content
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // 3. Configure Type (Icon & Color)
    if (type === 'success') {
        modalContent.classList.add('status-success');
        modalIcon.setAttribute('name', 'checkmark-circle');
    } else if (type === 'error') {
        modalContent.classList.add('status-error');
        modalIcon.setAttribute('name', 'alert-circle');
    } else {
        modalContent.classList.add('status-loading');
        modalIcon.setAttribute('name', 'information-circle');
    }

    // 4. Show Modal
    statusModal.classList.remove('hidden');
    // Small timeout to allow transition
    setTimeout(() => {
        statusModal.classList.add('show');
    }, 10);

    // 5. Handle Close
    modalBtn.onclick = () => {
        closeModal();
        if (onClose) onClose();
    };
}

function closeModal() {
    statusModal.classList.remove('show');
    setTimeout(() => {
        statusModal.classList.add('hidden');
    }, 300); // Match transition duration
}

function setLoading(button, isLoading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');

    if (isLoading) {
        button.disabled = true;
        text.classList.add('loading');
        spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        text.classList.remove('loading');
        spinner.classList.add('hidden');
    }
}

// --- Payment Logic (Wallet) ---
const payButtonWallet = document.getElementById('payButtonWallet');

payButtonWallet.addEventListener('click', async () => {
    const selectedProvider = document.querySelector('input[name="provider"]:checked').value;

    setLoading(payButtonWallet, true);

    try {
        const response = await fetch('/api/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: selectedProvider,
                amount: 50000
            })
        });

        const result = await response.json();

        if (result.success) {
            await new Promise(r => setTimeout(r, 800)); // Smooth UX

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            } else {
                setLoading(payButtonWallet, false);
                showModal('success', 'Payment Successful', `Transaction ID: ${result.transactionId}`);
            }
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error(error);
        setLoading(payButtonWallet, false);
        showModal('error', 'Payment Failed', error.message || 'An unexpected error occurred.');
    }
});

// --- Payment Logic (Card) ---
const cardNumber = document.getElementById('cardNumber');
const cardExpiry = document.getElementById('cardExpiry');
const cardCvv = document.getElementById('cardCvv');
const cardIcon = document.getElementById('cardIcon');
const payButtonCard = document.getElementById('payButtonCard');

// 1. Smart Formatting & Brand Detection
cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Clear any previously injected logo images
    const wrapper = cardIcon.parentElement;
    const existingLogo = wrapper.querySelector('.brand-logo-img');
    if (existingLogo) existingLogo.remove();

    // Brand Detection
    if (value.startsWith('4')) {
        // Visa - Show logo image
        cardIcon.style.display = 'none';
        const logoImg = document.createElement('img');
        logoImg.src = 'assets/visa_logo.png';
        logoImg.className = 'brand-logo-img';
        logoImg.style.height = '18px';
        logoImg.style.marginLeft = '16px';
        logoImg.style.marginRight = '8px';
        wrapper.appendChild(logoImg);
    } else if (value.startsWith('5')) {
        // Mastercard - Show logo image
        cardIcon.style.display = 'none';
        const logoImg = document.createElement('img');
        logoImg.src = 'assets/mastercard_logo.png';
        logoImg.className = 'brand-logo-img';
        logoImg.style.height = '18px';
        logoImg.style.marginLeft = '16px';
        logoImg.style.marginRight = '8px';
        wrapper.appendChild(logoImg);
    } else {
        // Default - Show card icon
        cardIcon.style.display = 'block';
        cardIcon.setAttribute('name', 'card');
        cardIcon.style.color = 'var(--text-muted)';
    }

    // Formatting (Groups of 4)
    value = value.substring(0, 16); // Limit length
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
        parts.push(value.substring(i, i + 4));
    }

    e.target.value = parts.join(' ');
});

cardExpiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
});

cardCvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
});

// 2. Card Payment Handler
payButtonCard.addEventListener('click', async () => {
    // Basic Validation
    if (cardNumber.value.length < 19 || cardExpiry.value.length < 5 || cardCvv.value.length < 3) {
        // Quick visual shake or error could go here, for now just modal
        showModal('error', 'Invalid Details', 'Please check your card information.');
        return;
    }

    setLoading(payButtonCard, true);

    // Simulate Network Request
    await new Promise(r => setTimeout(r, 2000));

    setLoading(payButtonCard, false);
    showModal('success', 'Payment Successful', 'Your card payment processed successfully. Transaction ID: CARD_X9923');
});
