const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const messageRoutes = require('./routes/message.routes');
const storyRoutes = require('./routes/story.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);

module.exports = app;