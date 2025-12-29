// Moved from root `server.js` so that static assets in the project
// are handled by Vercel’s static file serving and the API remains functional.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const anigo = require('anigo-anime-api');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// During local development you may want to serve static files as well.
// In production, Vercel automatically serves files from the project root.
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '..', 'public')));
}

// Root route (optional: useful for local dev only)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --- API Endpoints ---
app.get('/api/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.status(400).json({ error: 'Query is required' });
        const results = await anigo.searchGogo(q, parseInt(page));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/recent', async (req, res) => {
    try {
        const { page = 1, type = 1 } = req.query;
        const results = await anigo.getGogoRecentEpisodes(parseInt(type), parseInt(page));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/popular', async (req, res) => {
    try {
        const { type = 1 } = req.query;
        const results = await anigo.getPopular(parseInt(type));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const info = await anigo.getGogoAnimeInfo(id);
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/episode/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const source = await anigo.getGogoanimeEpisodeSource(id);
        res.json(source);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export the Express app for Vercel to wrap as a serverless function
// If this file is run directly (e.g. `node api/index.js`) start the server.
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`NETAME API listening on port ${PORT}`);
    });
}

// Proxy AI chat completion
app.post('/api/ai', async (req, res) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set' });
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });
        if (!groqRes.ok) {
            const text = await groqRes.text();
            console.error('Groq error', groqRes.status, text);
            return res.status(groqRes.status).json({ error: text });
        }
        const data = await groqRes.json();
        res.json(data);
    } catch (err) {
        console.error('Proxy /api/ai error', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
