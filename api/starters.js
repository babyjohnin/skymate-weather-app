const conversationStarters = [
    "What's the weather like today?",
    "Is it going to rain tomorrow?",
    "How's the weather in New York?"
];

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        res.json({ starters: conversationStarters });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}; 