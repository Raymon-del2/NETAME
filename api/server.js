// Moved from root `server.js` so that static assets in the project
// are handled by Vercel’s static file serving and the API remains functional.

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
    app.use(express.static(path.join(__dirname, '..')));
}

// Root route (optional: useful for local dev only)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
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
module.exports = app;
