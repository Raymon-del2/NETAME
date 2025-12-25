const express = require('express');
const cors = require('cors');
const anigo = require('anigo-anime-api');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the root

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoints
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
