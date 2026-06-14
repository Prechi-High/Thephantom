import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';

const router = Router();

router.post('/', SessionController.create);
router.post('/:id/activate', SessionController.activate);

export default router;
