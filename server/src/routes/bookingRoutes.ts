import { Router } from 'express';
import { createBooking, getBookings, cancelBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/', getBookings);
router.put('/:id/cancel', cancelBooking);

export default router;
