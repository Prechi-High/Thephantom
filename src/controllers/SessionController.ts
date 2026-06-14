import { Request, Response } from 'express';
import { SessionService } from '../services/SessionService';

export class SessionController {
  static async create(req: Request, res: Response) {
    try {
      const { name, startTime, rulesId } = req.body;
      const session = await SessionService.createSession(name, new Date(startTime), rulesId);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async activate(req: Request, res: Response) {
    try {
      await SessionService.activateSession(req.params.id);
      res.json({ message: 'Session activation triggered' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
