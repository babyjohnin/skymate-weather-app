require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Conversation starters
const conversationStarters = [
    "What's the weather like today?",
    "Is it going to rain tomorrow?",
    "How's the weather in New York?"
];

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/starters', (req, res) => {
    res.json({ starters: conversationStarters });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are SkyMate, a cheerful and helpful weather assistant. Keep your answers brief, friendly, and easy to understand. Always include an appropriate emoji and a one-line weather-related joke. Limit responses to 20 words or less."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });
        
        res.json({ 
            response: completion.choices[0].message.content,
            starters: conversationStarters
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: error.message
        });
    }
});

// Serve static files
app.use(express.static(__dirname));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    // If the request is for a file that exists, serve it
    if (req.path.endsWith('.html') || req.path.endsWith('.css') || req.path.endsWith('.js')) {
        res.sendFile(path.join(__dirname, req.path));
    } else {
        // Otherwise, serve the main application
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Export the Express API for Vercel
module.exports = app; 