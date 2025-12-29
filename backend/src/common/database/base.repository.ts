import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FilterOptions {
  where?: any;
  include?: any;
  select?: any;
}

@Injectable()
export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly logger: LoggingService,
    protected readonly modelName: string,
  ) {}

  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  async create(data: any, requestId?: string): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.model.create({ data });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('CREATE', this.modelName, duration, requestId);
      this.logger.logBusinessEvent(`${this.modelName} created`, { id: result.id }, undefined, requestId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation(`CREATE_ERROR`, this.modelName, duration, requestId);
      throw error;
    }
  }

  async findById(id: string, options?: FilterOptions, requestId?: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const result = await this.model.findUnique({
        where: { id },
        ...options,
      });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('FIND_BY_ID', this.modelName, duration, requestId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('FIND_BY_ID_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async findOne(where: any, options?: FilterOptions, requestId?: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const result = await this.model.findFirst({
        where,
        ...options,
      });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('FIND_ONE', this.modelName, duration, requestId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('FIND_ONE_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async findMany(
    options?: FilterOptions & PaginationOptions,
    requestId?: string,
  ): Promise<T[]> {
    const startTime = Date.now();
    try {
      const { page, limit, sortBy, sortOrder, ...filterOptions } = options || {};
      
      const queryOptions: any = { ...filterOptions };
      
      // Add pagination
      if (page && limit) {
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
      }
      
      // Add sorting
      if (sortBy) {
        queryOptions.orderBy = { [sortBy]: sortOrder || 'asc' };
      }
      
      const result = await this.model.findMany(queryOptions);
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('FIND_MANY', this.modelName, duration, requestId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('FIND_MANY_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async findManyWithPagination(
    options?: FilterOptions & PaginationOptions,
    requestId?: string,
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10, ...filterOptions } = options || {};
    const startTime = Date.now();

    try {
      // Get total count
      const total = await this.model.count({
        where: filterOptions.where,
      });

      // Get paginated data
      const data = await this.findMany(options, requestId);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('FIND_PAGINATED', this.modelName, duration, requestId);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('FIND_PAGINATED_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async update(id: string, data: any, requestId?: string): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.model.update({
        where: { id },
        data,
      });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('UPDATE', this.modelName, duration, requestId);
      this.logger.logBusinessEvent(`${this.modelName} updated`, { id }, undefined, requestId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('UPDATE_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async delete(id: string, requestId?: string): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.model.delete({
        where: { id },
      });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('DELETE', this.modelName, duration, requestId);
      this.logger.logBusinessEvent(`${this.modelName} deleted`, { id }, undefined, requestId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('DELETE_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async softDelete(id: string, requestId?: string): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('SOFT_DELETE', this.modelName, duration, requestId);
      this.logger.logBusinessEvent(`${this.modelName} soft deleted`, { id }, undefined, requestId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('SOFT_DELETE_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async count(where?: any, requestId?: string): Promise<number> {
    const startTime = Date.now();
    try {
      const result = await this.model.count({ where });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('COUNT', this.modelName, duration, requestId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('COUNT_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  async exists(where: any, requestId?: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const result = await this.model.findFirst({ where, select: { id: true } });
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('EXISTS', this.modelName, duration, requestId);
      return !!result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('EXISTS_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }

  // Transaction support
  async transaction<R>(fn: (tx: PrismaClient) => Promise<R>, requestId?: string): Promise<R> {
    const startTime = Date.now();
    try {
      const result = await this.prisma.$transaction(fn);
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('TRANSACTION', this.modelName, duration, requestId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('TRANSACTION_ERROR', this.modelName, duration, requestId);
      throw error;
    }
  }
}
