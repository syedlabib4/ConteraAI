// Load environment variables FIRST before any other imports
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// Route imports (these depend on env vars being loaded)
const AuthRouter = require('./Routes/AuthRouter');
const TrendRouter = require('./Routes/TrendRouter');
const SeoRouter = require('./Routes/SeoRouter');
const ContentRouter = require('./Routes/ContentRouter');
const PipelineRouter = require('./Routes/PipelineRouter');
const ImageRouter = require('./Routes/ImageRouter');
const SocialRouter = require('./Routes/SocialRouter');
const AgentRouter = require('./Routes/AgentRouter');

require('./Models/db');
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// Serve generated images as static files
const path = require('path');
app.use('/generated-images', express.static(path.join(__dirname, 'generated-images')));

// Health check
app.get('/ping', (req, res) => {
    res.send('PONG');
});

// Routes
app.use('/auth', AuthRouter);
app.use('/api/trends', TrendRouter);
app.use('/api/seo', SeoRouter);
app.use('/api/content', ContentRouter);
app.use('/api/pipeline', PipelineRouter);
app.use('/api/images', ImageRouter);
app.use('/api/social', SocialRouter);
app.use('/api/agent', AgentRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});