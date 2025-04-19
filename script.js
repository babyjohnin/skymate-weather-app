// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const startersContainer = document.getElementById('starters-container');
const homeButton = document.getElementById('home-button');

// API Configuration
const API_BASE_URL = window.location.origin;

// Conversation starters
const defaultStarters = [
    "What's the weather like today?",
    "Is it going to rain tomorrow?",
    "How's the weather in New York?"
];

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Show conversation starters
function showStarters(starters = defaultStarters) {
    startersContainer.innerHTML = '';
    starters.forEach(starter => {
        const button = document.createElement('button');
        button.className = 'starter-button';
        button.textContent = starter;
        button.onclick = () => {
            userInput.value = starter;
            handleUserInput();
        };
        startersContainer.appendChild(button);
    });
    startersContainer.style.display = 'flex';
}

// Hide conversation starters
function hideStarters() {
    startersContainer.style.display = 'none';
}

// Clear chat messages
function clearChat() {
    chatMessages.innerHTML = '';
}

// Go to home screen
async function goToHome() {
    clearChat();
    await loadStarters();
    addMessage("Welcome to SkyMate! How can I help you with the weather today? 🌤️", false);
}

// Load conversation starters
async function loadStarters() {
    try {
        console.log('Loading starters from:', `${API_BASE_URL}/api/starters`);
        const response = await fetch(`${API_BASE_URL}/api/starters`);
        console.log('Starters response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response was not JSON');
        }
        
        const data = await response.json();
        console.log('Starters data received:', data);
        
        if (!data || !data.starters) {
            throw new Error('Invalid response format: missing starters');
        }
        
        showStarters(data.starters);
    } catch (error) {
        console.error('Error loading starters:', error);
        addMessage(`Error loading conversation starters: ${error.message}`, false);
    }
}

// Handle user input
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    // Disable input and button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    hideStarters();

    // Show loading indicator
    const loadingMessage = addMessage("SkyMate is thinking...", false);

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove loading message and add actual response
        loadingMessage.remove();
        addMessage(data.response, false);

        // Show conversation starters
        showStarters(data.starters || defaultStarters);
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.remove();
        addMessage("Sorry, I'm having trouble connecting. Please try again later.", false);
        showStarters();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});
homeButton.addEventListener('click', goToHome);

// Initial setup
showStarters();
addMessage("Hi! I'm SkyMate, your weather assistant. How can I help you today? 🌤️", false); 