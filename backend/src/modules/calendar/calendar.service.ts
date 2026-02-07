import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarRepository } from './calendar.repository';
import { DayOfWeek, User } from '@prisma/client';
import { BulkUpdateScheduleDto, UpdateSingleDayDto } from './dto/work-schedule.dto';
import { CreateTimeOffDto, UpdateTimeOffDto } from './dto/time-off.dto';
import { CreateSpecialHoursDto, UpdateSpecialHoursDto } from './dto/special-hours.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly calendarRepository: CalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Work Schedule ──

  async getWorkSchedule(artisanId: string) {
    const schedule = await this.calendarRepository.getWorkSchedule(artisanId);

    // If no schedule exists yet, return defaults for all 7 days
    if (schedule.length === 0) {
      const days = Object.values(DayOfWeek);
      return days.map((day) => ({
        dayOfWeek: day,
        isAvailable: day !== 'SUNDAY' && day !== 'SATURDAY',
        startTime: '09:00',
        endTime: '17:00',
        breakStart: null,
        breakEnd: null,
      }));
    }

    return schedule;
  }

  async bulkUpdateSchedule(artisanId: string, dto: BulkUpdateScheduleDto) {
    const results = await Promise.all(
      dto.schedule.map((day) =>
        this.calendarRepository.upsertScheduleDay(artisanId, day.dayOfWeek, {
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
          breakStart: day.breakStart,
          breakEnd: day.breakEnd,
        }),
      ),
    );
    return results;
  }

  async updateSingleDay(
    artisanId: string,
    dayOfWeek: DayOfWeek,
    dto: UpdateSingleDayDto,
  ) {
    return this.calendarRepository.upsertScheduleDay(artisanId, dayOfWeek, {
      isAvailable: dto.isAvailable,
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakStart: dto.breakStart,
      breakEnd: dto.breakEnd,
    });
  }

  // ── Time Off ──

  async getTimeOffs(artisanId: string, startDate?: string, endDate?: string) {
    return this.calendarRepository.getTimeOffs(
      artisanId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async createTimeOff(artisanId: string, dto: CreateTimeOffDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.calendarRepository.createTimeOff({
      artisanId,
      startDate: start,
      endDate: end,
      reason: dto.reason,
      note: dto.note,
    });
  }

  async updateTimeOff(artisanId: string, id: string, dto: UpdateTimeOffDto) {
    const timeOff = await this.calendarRepository.findTimeOffById(id);
    if (!timeOff) throw new NotFoundException('Time off not found');
    if (timeOff.artisanId !== artisanId) throw new ForbiddenException();

    const updateData: any = {};
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.reason) updateData.reason = dto.reason;
    if (dto.note !== undefined) updateData.note = dto.note;

    return this.calendarRepository.updateTimeOff(id, updateData);
  }

  async deleteTimeOff(artisanId: string, id: string) {
    const timeOff = await this.calendarRepository.findTimeOffById(id);
    if (!timeOff) throw new NotFoundException('Time off not found');
    if (timeOff.artisanId !== artisanId) throw new ForbiddenException();

    return this.calendarRepository.deleteTimeOff(id);
  }

  // ── Special Hours ──

  async getSpecialHours(artisanId: string, startDate?: string, endDate?: string) {
    return this.calendarRepository.getSpecialHours(
      artisanId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async createSpecialHours(artisanId: string, dto: CreateSpecialHoursDto) {
    return this.calendarRepository.createSpecialHours({
      artisanId,
      date: new Date(dto.date),
      isAvailable: dto.isAvailable,
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakStart: dto.breakStart,
      breakEnd: dto.breakEnd,
      note: dto.note,
    });
  }

  async updateSpecialHours(artisanId: string, id: string, dto: UpdateSpecialHoursDto) {
    const specialHours = await this.calendarRepository.findSpecialHoursById(id);
    if (!specialHours) throw new NotFoundException('Special hours not found');
    if (specialHours.artisanId !== artisanId) throw new ForbiddenException();

    const updateData: any = {};
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.isAvailable !== undefined) updateData.isAvailable = dto.isAvailable;
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
    if (dto.breakStart !== undefined) updateData.breakStart = dto.breakStart;
    if (dto.breakEnd !== undefined) updateData.breakEnd = dto.breakEnd;
    if (dto.note !== undefined) updateData.note = dto.note;

    return this.calendarRepository.updateSpecialHours(id, updateData);
  }

  async deleteSpecialHours(artisanId: string, id: string) {
    const specialHours = await this.calendarRepository.findSpecialHoursById(id);
    if (!specialHours) throw new NotFoundException('Special hours not found');
    if (specialHours.artisanId !== artisanId) throw new ForbiddenException();

    return this.calendarRepository.deleteSpecialHours(id);
  }

  // ── Calendar Events (unified view) ──

  async getCalendarEvents(artisanId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const [jobs, timeOffs, specialHours] = await Promise.all([
      this.calendarRepository.getArtisanJobs(artisanId, start, end),
      this.calendarRepository.getTimeOffs(artisanId, start, end),
      this.calendarRepository.getSpecialHours(artisanId, start, end),
    ]);

    const events: any[] = [];

    // Map jobs to calendar events
    for (const job of jobs) {
      events.push({
        id: job.id,
        type: 'JOB',
        title: job.title,
        startDate: job.startDate,
        endDate: job.endDate,
        status: job.status,
        category: job.category?.name,
        client: {
          name: job.client?.profile?.firstName
            ? `${job.client.profile.firstName} ${job.client.profile.lastName || ''}`
            : 'Client',
        },
        amount: job.bids?.[0]?.amount,
        jobId: job.id,
      });
    }

    // Map time-offs to calendar events
    for (const timeOff of timeOffs) {
      events.push({
        id: timeOff.id,
        type: 'TIME_OFF',
        title: `Time Off - ${timeOff.reason}`,
        startDate: timeOff.startDate,
        endDate: timeOff.endDate,
        reason: timeOff.reason,
        note: timeOff.note,
      });
    }

    // Map special hours to calendar events
    for (const sh of specialHours) {
      events.push({
        id: sh.id,
        type: 'SPECIAL_HOURS',
        title: sh.isAvailable
          ? `Special Hours: ${sh.startTime}-${sh.endTime}`
          : 'Day Off (Override)',
        startDate: sh.date,
        endDate: sh.date,
        isAvailable: sh.isAvailable,
        startTime: sh.startTime,
        endTime: sh.endTime,
        note: sh.note,
      });
    }

    return events.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }

  async getUpcomingJobs(artisanId: string) {
    return this.calendarRepository.getUpcomingJobs(artisanId);
  }

  async getTodaySchedule(artisanId: string) {
    const today = new Date();
    const dayIndex = today.getDay(); // 0=Sun, 1=Mon...
    const dayMap: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const todayDayOfWeek = dayMap[dayIndex];

    // Check for special hours first (override)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [scheduleRows, specialHours, timeOffs, jobs] = await Promise.all([
      this.calendarRepository.getWorkSchedule(artisanId),
      this.calendarRepository.getSpecialHours(artisanId, todayStart, todayEnd),
      this.calendarRepository.getTimeOffs(artisanId, todayStart, todayEnd),
      this.calendarRepository.getTodayJobs(artisanId),
    ]);

    // Determine today's working hours
    const specialToday = specialHours[0]; // At most one per day due to unique constraint
    const regularSchedule = scheduleRows.find((s) => s.dayOfWeek === todayDayOfWeek);
    const isTimeOff = timeOffs.length > 0;

    let workHours: any;
    if (isTimeOff) {
      workHours = {
        isAvailable: false,
        reason: 'TIME_OFF',
        timeOff: timeOffs[0],
      };
    } else if (specialToday) {
      workHours = {
        isAvailable: specialToday.isAvailable,
        startTime: specialToday.startTime,
        endTime: specialToday.endTime,
        breakStart: specialToday.breakStart,
        breakEnd: specialToday.breakEnd,
        reason: 'SPECIAL_HOURS',
        note: specialToday.note,
      };
    } else if (regularSchedule) {
      workHours = {
        isAvailable: regularSchedule.isAvailable,
        startTime: regularSchedule.startTime,
        endTime: regularSchedule.endTime,
        breakStart: regularSchedule.breakStart,
        breakEnd: regularSchedule.breakEnd,
        reason: 'REGULAR',
      };
    } else {
      workHours = {
        isAvailable: todayDayOfWeek !== 'SUNDAY' && todayDayOfWeek !== 'SATURDAY',
        startTime: '09:00',
        endTime: '17:00',
        breakStart: null,
        breakEnd: null,
        reason: 'DEFAULT',
      };
    }

    return {
      date: today.toISOString(),
      dayOfWeek: todayDayOfWeek,
      workHours,
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        startDate: job.startDate,
        endDate: job.endDate,
        category: job.category?.name,
        client: {
          name: job.client?.profile?.firstName
            ? `${job.client.profile.firstName} ${job.client.profile.lastName || ''}`
            : 'Client',
        },
        amount: job.bids?.[0]?.amount,
      })),
    };
  }

  // ── Job Reminder Scheduling ──

  async scheduleJobReminders(artisanId: string, jobId: string, startDate: Date) {
    const reminders = [];

    // 24-hour reminder
    const reminder24h = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > new Date()) {
      reminders.push({
        userId: artisanId,
        type: 'JOB_REMINDER_24H' as const,
        title: 'Job Starting Tomorrow',
        message: 'You have a job starting in 24 hours.',
        data: {
          jobId,
          scheduledFor: reminder24h.toISOString(),
        },
      });
    }

    // 1-hour reminder
    const reminder1h = new Date(startDate.getTime() - 60 * 60 * 1000);
    if (reminder1h > new Date()) {
      reminders.push({
        userId: artisanId,
        type: 'JOB_REMINDER_1H' as const,
        title: 'Job Starting Soon',
        message: 'You have a job starting in 1 hour.',
        data: {
          jobId,
          scheduledFor: reminder1h.toISOString(),
        },
      });
    }

    if (reminders.length > 0) {
      await this.prisma.notification.createMany({ data: reminders });
    }

    return reminders.length;
  }
}
