import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

// Get all resources with search, category filter, and pagination
export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: true // Soft delete filter
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.resource.count({ where })
    ]);

    return sendSuccess(res, 200, 'Resources fetched successfully', {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Get single resource by ID with today's bookings
export const getResourceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parsePositiveInteger(id);

    if (!resourceId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Resource id must be a positive integer');
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    if (!resource.isAvailable) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    // Today's start and end timestamps
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayBookings = await prisma.booking.findMany({
      where: {
        resourceId: Number(id),
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { gte: startOfDay, lte: endOfDay }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        purpose: true,
        user: { select: { name: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return sendSuccess(res, 200, 'Resource fetched successfully', { resource, todayBookings });
  } catch (error) {
    console.error('Error fetching resource details:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Create a new resource (Admin only)
export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, capacity, location, description } = req.body;

    if (!name || !category) {
      return sendError(res, 400, 'BAD_REQUEST', 'Name and category are required');
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        category,
        capacity: capacity ? Number(capacity) : null,
        location: location || null,
        description: description || null
      }
    });

    return sendSuccess(res, 201, 'Resource created successfully', { resource });
  } catch (error) {
    console.error('Error creating resource:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Update an existing resource (Admin only)
export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parsePositiveInteger(id);

    if (!resourceId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Resource id must be a positive integer');
    }
    const { name, category, capacity, location, description } = req.body;

    const existing = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!existing || !existing.isAvailable) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description })
      }
    });

    return sendSuccess(res, 200, 'Resource updated successfully', { resource: updatedResource });
  } catch (error) {
    console.error('Error updating resource:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Soft delete resource (Admin only - sets isAvailable to false)
export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parsePositiveInteger(id);

    if (!resourceId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Resource id must be a positive integer');
    }

    const existing = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!existing || !existing.isAvailable) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    await prisma.resource.update({
      where: { id: resourceId },
      data: { isAvailable: false }
    });

    return sendSuccess(res, 200, 'Resource deleted successfully');
  } catch (error) {
    console.error('Error deleting resource:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};
