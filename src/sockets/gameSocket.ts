import { Server } from 'socket.io';
import { GameEngine } from '../services/GameEngine';
import { ShopService } from '../services/ShopService';
import redis from '../config/redis';

export const setupGameSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_subsession', async ({ subSessionId, userId }) => {
      socket.join(`subsession:${subSessionId}`);
      console.log(`User ${userId} joined subsession ${subSessionId}`);
      
      const stateRaw = await redis.get(`subsession:${subSessionId}:state`);
      if (stateRaw) {
        socket.emit('state_update', JSON.parse(stateRaw));
      }
    });

    socket.on('buy_item', async ({ subSessionId, userId, itemId }) => {
      try {
        await ShopService.purchaseItem(subSessionId, userId, itemId);
        
        // Broadcast updated state
        const stateRaw = await redis.get(`subsession:${subSessionId}:state`);
        if (stateRaw) {
          io.to(`subsession:${subSessionId}`).emit('state_update', JSON.parse(stateRaw));
        }
        socket.emit('buy_success', { itemId });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('spin', async ({ subSessionId, userId }) => {
      try {
        const { action, result, newState } = await GameEngine.processSpin(subSessionId, userId);
        
        io.to(`subsession:${subSessionId}`).emit('spin_result', {
          userId,
          action,
          result,
        });

        io.to(`subsession:${subSessionId}`).emit('state_update', newState);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
