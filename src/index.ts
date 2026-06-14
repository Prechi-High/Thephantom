import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessionRoutes';
import { setupGameSocket } from './sockets/gameSocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', 
  },
});

app.use(express.json());

// Routes
app.use('/api/sessions', sessionRoutes);

// Sockets
setupGameSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`The Phantom Backend running on port ${PORT}`);
});
