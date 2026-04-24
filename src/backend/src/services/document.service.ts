import { PrismaClient, DocumentType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateDocumentInput } from '../utils/validation';

const prisma = new PrismaClient();

export class DocumentService {
  async create(projectId: string, userId: string, data: CreateDocumentInput) {
    // Stub: in production, file would be uploaded to S3 and fileUrl generated
    const doc = await prisma.rFQDocument.create({
      data: {
        projectId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        documentType: (data.documentType as DocumentType) || 'other',
        uploadedById: userId,
      },
    });
    return doc;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.rFQDocument.findMany({
        where: { projectId },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rFQDocument.count({ where: { projectId } }),
    ]);
    return { documents, total, page, limit };
  }

  async delete(id: string) {
    const doc = await prisma.rFQDocument.findUnique({ where: { id } });
    if (!doc) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');

    // Stub: in production, also delete from S3
    await prisma.rFQDocument.delete({ where: { id } });
  }
}

export const documentService = new DocumentService();
