// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const startersContainer = document.getElementById('starters-container');
const homeButton = document.getElementById('home-button');

// API Configuration
const API_BASE_URL = window.location.origin;

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
function showStarters(starters) {
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
        const response = await fetch(`${API_BASE_URL}/api/starters`);
        const data = await response.json();
        showStarters(data.starters);
    } catch (error) {
        console.error('Error loading starters:', error);
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
        console.log('Sending request to server...');
        // Send message to our server
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || data.details || 'Network response was not ok');
        }

        // Remove loading message and add actual response
        loadingMessage.remove();
        addMessage(data.response, false);

        // If we have coordinates, fetch and display weather
        if (data.coordinates) {
            const weatherMessage = addMessage("Fetching weather data...", false);
            try {
                const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${data.coordinates.lat}&lon=${data.coordinates.lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
                const weatherData = await weatherResponse.json();
                
                weatherMessage.remove();
                const weatherInfo = `
                    Current weather in ${data.coordinates.name}, ${data.coordinates.country}:
                    Temperature: ${weatherData.main.temp}°C
                    Feels like: ${weatherData.main.feels_like}°C
                    Weather: ${weatherData.weather[0].description}
                    Wind: ${weatherData.wind.speed} m/s
                `;
                addMessage(weatherInfo, false);
            } catch (error) {
                weatherMessage.remove();
                addMessage("Sorry, I couldn't fetch the weather data right now.", false);
            }
        }

        // If the response includes starters, show them
        if (data.starters) {
            showStarters(data.starters);
        }
    } catch (error) {
        console.error('Detailed error:', error);
        loadingMessage.remove();
        addMessage(`Error: ${error.message}. Please check the console for more details and ensure the server is running.`, false);
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
goToHome(); 