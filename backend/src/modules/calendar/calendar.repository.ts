import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DayOfWeek, Prisma } from '@prisma/client';

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Work Schedule ──

  async getWorkSchedule(artisanId: string) {
    return this.prisma.artisanWorkSchedule.findMany({
      where: { artisanId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsertScheduleDay(
    artisanId: string,
    dayOfWeek: DayOfWeek,
    data: {
      isAvailable: boolean;
      startTime: string;
      endTime: string;
      breakStart?: string | null;
      breakEnd?: string | null;
    },
  ) {
    return this.prisma.artisanWorkSchedule.upsert({
      where: {
        artisanId_dayOfWeek: { artisanId, dayOfWeek },
      },
      update: {
        isAvailable: data.isAvailable,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart ?? null,
        breakEnd: data.breakEnd ?? null,
      },
      create: {
        artisanId,
        dayOfWeek,
        isAvailable: data.isAvailable,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart ?? null,
        breakEnd: data.breakEnd ?? null,
      },
    });
  }

  // ── Time Off ──

  async getTimeOffs(artisanId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ArtisanTimeOffWhereInput = { artisanId };
    if (startDate && endDate) {
      where.OR = [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ];
    }
    return this.prisma.artisanTimeOff.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async createTimeOff(data: Prisma.ArtisanTimeOffUncheckedCreateInput) {
    return this.prisma.artisanTimeOff.create({ data });
  }

  async findTimeOffById(id: string) {
    return this.prisma.artisanTimeOff.findUnique({ where: { id } });
  }

  async updateTimeOff(id: string, data: Prisma.ArtisanTimeOffUpdateInput) {
    return this.prisma.artisanTimeOff.update({ where: { id }, data });
  }

  async deleteTimeOff(id: string) {
    return this.prisma.artisanTimeOff.delete({ where: { id } });
  }

  // ── Special Hours ──

  async getSpecialHours(artisanId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ArtisanSpecialHoursWhereInput = { artisanId };
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }
    return this.prisma.artisanSpecialHours.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async createSpecialHours(data: Prisma.ArtisanSpecialHoursUncheckedCreateInput) {
    return this.prisma.artisanSpecialHours.create({ data });
  }

  async findSpecialHoursById(id: string) {
    return this.prisma.artisanSpecialHours.findUnique({ where: { id } });
  }

  async updateSpecialHours(id: string, data: Prisma.ArtisanSpecialHoursUpdateInput) {
    return this.prisma.artisanSpecialHours.update({ where: { id }, data });
  }

  async deleteSpecialHours(id: string) {
    return this.prisma.artisanSpecialHours.delete({ where: { id } });
  }

  // ── Jobs (for calendar events) ──

  async getArtisanJobs(artisanId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.JobWhereInput = {
      bids: {
        some: {
          artisanId,
          status: 'ACCEPTED',
        },
      },
      status: { in: ['IN_PROGRESS', 'COMPLETED', 'OPEN'] },
    };

    if (startDate && endDate) {
      where.OR = [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ];
    }

    return this.prisma.job.findMany({
      where,
      include: {
        category: true,
        client: { include: { profile: true } },
        bids: {
          where: { artisanId, status: 'ACCEPTED' },
          select: { id: true, amount: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async getUpcomingJobs(artisanId: string, limit = 10) {
    return this.prisma.job.findMany({
      where: {
        bids: {
          some: {
            artisanId,
            status: 'ACCEPTED',
          },
        },
        status: 'IN_PROGRESS',
        startDate: { gte: new Date() },
      },
      include: {
        category: true,
        client: { include: { profile: true } },
        bids: {
          where: { artisanId, status: 'ACCEPTED' },
          select: { id: true, amount: true },
        },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    });
  }

  async getTodayJobs(artisanId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return this.prisma.job.findMany({
      where: {
        bids: {
          some: {
            artisanId,
            status: 'ACCEPTED',
          },
        },
        status: { in: ['IN_PROGRESS', 'OPEN'] },
        OR: [
          { startDate: { gte: todayStart, lte: todayEnd } },
          { endDate: { gte: todayStart, lte: todayEnd } },
          {
            AND: [
              { startDate: { lte: todayStart } },
              { endDate: { gte: todayEnd } },
            ],
          },
        ],
      },
      include: {
        category: true,
        client: { include: { profile: true } },
        bids: {
          where: { artisanId, status: 'ACCEPTED' },
          select: { id: true, amount: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
