import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole, DayOfWeek } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { BulkUpdateScheduleDto, UpdateSingleDayDto } from './dto/work-schedule.dto';
import { CreateTimeOffDto, UpdateTimeOffDto } from './dto/time-off.dto';
import { CreateSpecialHoursDto, UpdateSpecialHoursDto } from './dto/special-hours.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ── Work Schedule ──

  @Get('schedule')
  @ApiOperation({ summary: 'Get weekly work schedule' })
  @ApiResponse({ status: 200, description: 'Returns the 7-day work schedule' })
  async getSchedule(@CurrentUser() user: any) {
    return this.calendarService.getWorkSchedule(user.id);
  }

  @Put('schedule')
  @ApiOperation({ summary: 'Bulk upsert weekly schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  async bulkUpdateSchedule(
    @CurrentUser() user: any,
    @Body() dto: BulkUpdateScheduleDto,
  ) {
    return this.calendarService.bulkUpdateSchedule(user.id, dto);
  }

  @Patch('schedule/:dayOfWeek')
  @ApiOperation({ summary: 'Update a single day schedule' })
  @ApiResponse({ status: 200, description: 'Day schedule updated' })
  async updateSingleDay(
    @CurrentUser() user: any,
    @Param('dayOfWeek') dayOfWeek: DayOfWeek,
    @Body() dto: UpdateSingleDayDto,
  ) {
    return this.calendarService.updateSingleDay(user.id, dayOfWeek, dto);
  }

  // ── Time Off ──

  @Get('time-off')
  @ApiOperation({ summary: 'List time-offs (optional date range filter)' })
  @ApiResponse({ status: 200, description: 'Returns time-off records' })
  async getTimeOffs(
    @CurrentUser() user: any,
    @Query() query: CalendarQueryDto,
  ) {
    return this.calendarService.getTimeOffs(user.id, query.startDate, query.endDate);
  }

  @Post('time-off')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create time-off' })
  @ApiResponse({ status: 201, description: 'Time-off created' })
  async createTimeOff(
    @CurrentUser() user: any,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.calendarService.createTimeOff(user.id, dto);
  }

  @Patch('time-off/:id')
  @ApiOperation({ summary: 'Update time-off' })
  @ApiResponse({ status: 200, description: 'Time-off updated' })
  async updateTimeOff(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTimeOffDto,
  ) {
    return this.calendarService.updateTimeOff(user.id, id, dto);
  }

  @Delete('time-off/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time-off' })
  @ApiResponse({ status: 204, description: 'Time-off deleted' })
  async deleteTimeOff(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.calendarService.deleteTimeOff(user.id, id);
  }

  // ── Special Hours ──

  @Get('special-hours')
  @ApiOperation({ summary: 'List special hours (optional date range filter)' })
  @ApiResponse({ status: 200, description: 'Returns special hours records' })
  async getSpecialHours(
    @CurrentUser() user: any,
    @Query() query: CalendarQueryDto,
  ) {
    return this.calendarService.getSpecialHours(user.id, query.startDate, query.endDate);
  }

  @Post('special-hours')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create special hours' })
  @ApiResponse({ status: 201, description: 'Special hours created' })
  async createSpecialHours(
    @CurrentUser() user: any,
    @Body() dto: CreateSpecialHoursDto,
  ) {
    return this.calendarService.createSpecialHours(user.id, dto);
  }

  @Patch('special-hours/:id')
  @ApiOperation({ summary: 'Update special hours' })
  @ApiResponse({ status: 200, description: 'Special hours updated' })
  async updateSpecialHours(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSpecialHoursDto,
  ) {
    return this.calendarService.updateSpecialHours(user.id, id, dto);
  }

  @Delete('special-hours/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete special hours' })
  @ApiResponse({ status: 204, description: 'Special hours deleted' })
  async deleteSpecialHours(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.calendarService.deleteSpecialHours(user.id, id);
  }

  // ── Unified Calendar ──

  @Get('events')
  @ApiOperation({ summary: 'Get unified calendar events (jobs + time-off + special hours)' })
  @ApiResponse({ status: 200, description: 'Returns all calendar events' })
  async getCalendarEvents(
    @CurrentUser() user: any,
    @Query() query: CalendarQueryDto,
  ) {
    return this.calendarService.getCalendarEvents(user.id, query.startDate, query.endDate);
  }

  @Get('upcoming-jobs')
  @ApiOperation({ summary: 'Get upcoming jobs sorted by date' })
  @ApiResponse({ status: 200, description: 'Returns upcoming jobs' })
  async getUpcomingJobs(@CurrentUser() user: any) {
    return this.calendarService.getUpcomingJobs(user.id);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's schedule + jobs" })
  @ApiResponse({ status: 200, description: "Returns today's schedule and jobs" })
  async getTodaySchedule(@CurrentUser() user: any) {
    return this.calendarService.getTodaySchedule(user.id);
  }
}
