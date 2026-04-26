require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const analyzeRouter = require('./routes/analyze');
const queueRouter = require('./routes/queue');
const { getQueue, removePatient } = require('./utils/queueManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Attach io to requests so routes can emit events
app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/analyze', analyzeRouter);
app.use('/api/queue', queueRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Send current queue on connect
  socket.emit('queue:update', getQueue());

  socket.on('queue:call', ({ token }) => {
    removePatient(token);
    io.emit('queue:update', getQueue());
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`MediQueue backend running on port ${PORT}`));
