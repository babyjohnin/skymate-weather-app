require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Conversation starters
const conversationStarters = [
    "How's the weather, mate.",
    "Is it cold out in Toronto?",
    "Is it supposed to rain today in Kochi?"
];

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// Get conversation starters
app.get('/api/starters', (req, res) => {
    try {
        console.log('GET /api/starters called');
        console.log('Sending starters:', conversationStarters);
        res.json({ starters: conversationStarters });
    } catch (error) {
        console.error('Error in /api/starters:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Geocoding function
async function getCoordinates(cityName) {
    try {
        const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
            params: {
                q: cityName,
                limit: 1,
                appid: process.env.OPENWEATHER_API_KEY
            }
        });

        if (response.data && response.data.length > 0) {
            return {
                lat: response.data[0].lat,
                lon: response.data[0].lon,
                name: response.data[0].name,
                country: response.data[0].country
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('POST /api/chat called with body:', req.body);
        const { message } = req.body;

        if (!message) {
            console.error('No message provided in request');
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if user wants to see conversation starters
        if (message.toLowerCase() === 'home') {
            console.log('Home requested, sending starters');
            return res.json({ 
                response: "Welcome back! Here are some conversation starters:",
                starters: conversationStarters
            });
        }

        // Extract city name from message using OpenAI
        const cityExtraction = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Extract the city name from the user's message. If there's no city mentioned, return 'NO_CITY'. Only return the city name, nothing else."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.3,
            max_tokens: 50
        });

        const extractedCity = cityExtraction.choices[0].message.content.trim();
        let coordinates = null;
        let weatherData = null;

        if (extractedCity !== 'NO_CITY') {
            coordinates = await getCoordinates(extractedCity);
            if (coordinates) {
                try {
                    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                        params: {
                            lat: coordinates.lat,
                            lon: coordinates.lon,
                            appid: process.env.OPENWEATHER_API_KEY,
                            units: 'metric'
                        }
                    });
                    weatherData = weatherResponse.data;
                } catch (error) {
                    console.error('Weather API error:', error);
                }
            }
        }

        console.log('Making OpenAI API request...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are SkyMate, a cheerful and helpful weather assistant. Your task is to provide real-time weather updates to users. If a city is mentioned in the user's message, do NOT ask for the city name again - instead, provide a friendly response about the weather in that city. If no city is mentioned, politely ask for the city name. Keep your answers brief, friendly, and easy to understand. Always include an appropriate emoji and a one-line weather-related joke. Limit responses to 20 words or less.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        console.log('OpenAI API response received:', completion.choices[0].message);
        console.log('Sending response with:', {
            response: completion.choices[0].message.content,
            hasCoordinates: !!coordinates,
            hasWeather: !!weatherData,
            starters: conversationStarters
        });
        
        res.json({ 
            response: completion.choices[0].message.content,
            coordinates: coordinates,
            weather: weatherData,
            starters: conversationStarters
        });
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: error.message
        });
    }
});

// Serve static files - moved after API routes
app.use(express.static(path.join(__dirname, '.')));

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
        console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
        console.log('OpenWeather API Key:', process.env.OPENWEATHER_API_KEY ? 'Present' : 'Missing');
    });
}

// Export the Express API for Vercel
module.exports = app; 