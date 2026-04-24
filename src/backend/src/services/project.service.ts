import { PrismaClient, ProjectStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateProjectInput, UpdateProjectInput } from '../utils/validation';

const prisma = new PrismaClient();

export class ProjectService {
  async create(userId: string, data: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: (data.status as ProjectStatus) || 'draft',
        address: data.address,
        city: data.city,
        state: data.state,
        architectName: data.architectName,
        generalContractor: data.generalContractor,
        orgId: data.orgId || null,
        createdById: userId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        estimatedValue: data.estimatedValue,
      },
    });
    return project;
  }

  async list(orgId?: string, page = 1, limit = 20, status?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (orgId) where.orgId = orgId;
    else if (userId) where.createdById = userId;
    if (status) where.status = status as ProjectStatus;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: { select: { quotes: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total, page, limit };
  }

  async getById(id: string) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        quotes: {
          select: { id: true, quoteNumber: true, version: true, status: true, total: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { quotes: true, changeOrders: true, invoices: true } },
      },
    });

    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }
    return project;
  }

  async update(id: string, data: UpdateProjectInput) {
    const project = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as ProjectStatus }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.architectName !== undefined && { architectName: data.architectName }),
        ...(data.generalContractor !== undefined && { generalContractor: data.generalContractor }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
      },
    });

    return updated;
  }

  async softDelete(id: string) {
    const project = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const projectService = new ProjectService();
