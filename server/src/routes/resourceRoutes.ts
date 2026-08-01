import { Router } from 'express';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourceController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all resource routes with JWT auth
router.use(authenticate);

// Student & Admin: View resources
router.get('/', getResources);
router.get('/:id', getResourceById);

// Admin only routes
router.post('/', authorizeAdmin, createResource);
router.put('/:id', authorizeAdmin, updateResource);
router.delete('/:id', authorizeAdmin, deleteResource);

export default router;
