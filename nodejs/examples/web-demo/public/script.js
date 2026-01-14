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

// --- Payment Logic (Wallet) ---
const payButtonWallet = document.getElementById('payButtonWallet');
const btnText = payButtonWallet.querySelector('.btn-text');
const spinner = payButtonWallet.querySelector('.spinner');

payButtonWallet.addEventListener('click', async () => {
    const selectedProvider = document.querySelector('input[name="provider"]:checked').value;

    setLoading(true);

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
                alert('Success! Transaction ID: ' + result.transactionId);
                setLoading(false);
            }
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error(error);
        alert('Payment Failed: ' + error.message);
        setLoading(false);
    }
});

function setLoading(isLoading) {
    if (isLoading) {
        payButtonWallet.disabled = true;
        btnText.classList.add('loading');
        spinner.classList.remove('hidden');
    } else {
        payButtonWallet.disabled = false;
        btnText.classList.remove('loading');
        spinner.classList.add('hidden');
    }
}
