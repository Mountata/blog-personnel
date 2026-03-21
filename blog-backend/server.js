const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const connectDB       = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

dotenv.config();
process.on('unhandledRejection', (err) => console.error('🔴 UNHANDLED:', err.message));
connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin:  'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ─── Routes existantes ────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/articles',      require('./routes/articleRoutes'));
app.use('/api/comments',      require('./routes/commentRoutes'));
app.use('/api/reactions',     require('./routes/reactionRoutes'));
app.use('/api/friends',       require('./routes/friendRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/search',        require('./routes/searchRoutes'));
app.use('/api/ai',            require('./routes/aiRoutes'));

// ─── Nouvelles routes ─────────────────────────────────────────
app.use('/api/circles',   require('./routes/circleRoutes'));    // ⭕ Cercles
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // 📊 Vue d'ensemble
app.use('/api/profile',   require('./routes/profileRoutes'));   // 🪪 Profil Vitrine

require('./socket/socketHandler')(io);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));