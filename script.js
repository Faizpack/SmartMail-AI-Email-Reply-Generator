// Initialize Lucide icons
lucide.createIcons();

// --- STATE & DATA ---
const TONES = ['Formal', 'Casual', 'Professional', 'Friendly', 'Apologetic', 'Assertive'];
const LENGTHS = ['Short', 'Medium', 'Detailed'];

let currentTone = 'Professional';
let currentLength = 'Medium';

// --- ELEMENTS ---
const toneSelector = document.getElementById('toneSelector');
const lengthSelector = document.getElementById('lengthSelector');
const themeToggle = document.getElementById('themeToggle');
const generateBtn = document.getElementById('generateBtn');
const emailInput = document.getElementById('emailInput');

const contextPanel = document.getElementById('contextPanel');
const intentBadge = document.getElementById('intentBadge');
const summaryText = document.getElementById('summaryText');

const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const repliesContainer = document.getElementById('repliesContainer');

const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');

const replyCardTemplate = document.getElementById('replyCardTemplate');

// --- INITIALIZATION ---
function init() {
    renderToneSelector();
    renderLengthSelector();

    // Setup Theme toggle
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });

    // Setup Generate button
    generateBtn.addEventListener('click', handleGenerate);
}

// --- RENDERERS ---
function renderToneSelector() {
    toneSelector.innerHTML = '';
    TONES.forEach(tone => {
        const btn = document.createElement('button');
        btn.textContent = tone;
        btn.className = `py-2 px-3 text-sm rounded-lg border font-medium transition-colors duration-200 ${
            currentTone === tone 
                ? 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/50' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
        }`;
        btn.addEventListener('click', () => {
            currentTone = tone;
            renderToneSelector(); // Re-render to update classes
        });
        toneSelector.appendChild(btn);
    });
}

function renderLengthSelector() {
    lengthSelector.innerHTML = '';
    LENGTHS.forEach(len => {
        const btn = document.createElement('button');
        btn.textContent = len;
        btn.className = `flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            currentLength === len 
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transparent'
        }`;
        btn.addEventListener('click', () => {
            currentLength = len;
            renderLengthSelector(); // Re-render
        });
        lengthSelector.appendChild(btn);
    });
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    setTimeout(() => {
        errorBanner.classList.add('hidden');
    }, 5000);
}

// --- API HANDLING ---
async function handleGenerate() {
    const text = emailInput.value.trim();
    if (!text) {
        showError("Please enter an email text first.");
        return;
    }

    // Set UI to loading state
    generateBtn.disabled = true;
    errorBanner.classList.add('hidden');
    emptyState.classList.add('hidden');
    contextPanel.classList.add('hidden');
    repliesContainer.innerHTML = '';
    
    // We recreate it so it shows block instead of keeping hidden
    loadingState.classList.remove('hidden');
    loadingState.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_text: text,
                tone: currentTone,
                length: currentLength
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Server error occurred");
        }

        const data = await response.json();
        
        // Hide loader
        loadingState.style.display = 'none';
        loadingState.classList.add('hidden');

        // Show Results
        displayResults(data);

    } catch (err) {
        loadingState.style.display = 'none';
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        generateBtn.disabled = false;
        
        let errorMsg = err.message;
        if (errorMsg.includes("Failed to fetch")) {
            errorMsg = "Ensure the backend server is running on http://localhost:8000";
        }
        showError(`Failed: ${errorMsg}`);
    } finally {
        generateBtn.disabled = false;
    }
}

function displayResults(data) {
    // 1. Context Panel
    intentBadge.textContent = data.intent;
    summaryText.textContent = data.summary;
    contextPanel.classList.remove('hidden');

    // 2. Render Cards
    repliesContainer.innerHTML = '';
    
    data.replies.forEach((reply, idx) => {
        const clone = replyCardTemplate.content.cloneNode(true);
        
        const contentDiv = clone.querySelector('.reply-content');
        contentDiv.textContent = reply;
        
        const indexSpan = clone.querySelector('.reply-index');
        indexSpan.textContent = idx + 1;

        const copyBtn = clone.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(reply);
                const icon = copyBtn.querySelector('i');
                icon.setAttribute('data-lucide', 'check');
                icon.classList.add('text-green-500');
                lucide.createIcons();
                setTimeout(() => {
                    icon.setAttribute('data-lucide', 'copy');
                    icon.classList.remove('text-green-500');
                    lucide.createIcons();
                }, 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        });

        repliesContainer.appendChild(clone);
    });

    // Re-initialize icons for the newly injected templates
    lucide.createIcons();
}

// Start up
document.addEventListener('DOMContentLoaded', init);
