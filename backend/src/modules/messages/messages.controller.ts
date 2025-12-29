import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageQueryDto, MarkAsReadDto } from './dto/message-query.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid message data',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to send message in this conversation',
  })
  async createMessage(
    @CurrentUser('id') userId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(userId, createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.messagesService.getMessages(userId, query);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
  })
  @ApiResponse({
    status: 400,
    description: 'Either messageId or jobId must be provided',
  })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    return this.messagesService.markAsRead(userId, markAsReadDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.messagesService.getUnreadCount(userId, jobId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file for message attachment' })
  @ApiBody({
    description: 'File to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file
    await this.messagesService.validateFileUpload(file);

    // In a real implementation, you would upload to S3/MinIO here
    // For now, return mock file URL
    const fileUrl = `https://storage.example.com/messages/${userId}/${file.originalname}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  @Post(':messageId/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a message' })
  @ApiResponse({
    status: 200,
    description: 'Message reported successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          example: 'Spam or inappropriate content',
        },
      },
      required: ['reason'],
    },
  })
  async reportMessage(
    @CurrentUser('id') userId: string,
    @Param('messageId') messageId: string,
    @Body('reason') reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    await this.messagesService.reportMessage(userId, messageId, reason);

    return {
      message: 'Message reported successfully',
    };
  }

  @Post('block-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user from messaging' })
  @ApiResponse({
    status: 200,
    description: 'User blocked successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        blockedUserId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      required: ['blockedUserId'],
    },
  })
  async blockUser(
    @CurrentUser('id') userId: string,
    @Body('blockedUserId') blockedUserId: string,
  ) {
    if (!blockedUserId) {
      throw new BadRequestException('blockedUserId is required');
    }

    await this.messagesService.blockUser(userId, blockedUserId);

    return {
      message: 'User blocked successfully',
    };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get messages for a specific job conversation' })
  @ApiResponse({
    status: 200,
    description: 'Job messages retrieved successfully',
  })
  async getJobMessages(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Query() query: MessageQueryDto,
  ) {
    const jobQuery = Object.assign(new MessageQueryDto(), { ...query, jobId });
    return this.messagesService.getMessages(userId, jobQuery);
  }

  @Get('job/:jobId/unread-count')
  @ApiOperation({ summary: 'Get unread message count for a specific job' })
  @ApiResponse({
    status: 200,
    description: 'Job unread count retrieved successfully',
  })
  async getJobUnreadCount(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.messagesService.getUnreadCount(userId, jobId);
  }

  @Post('job/:jobId/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a job conversation as read' })
  @ApiResponse({
    status: 200,
    description: 'Job messages marked as read',
  })
  async markJobMessagesAsRead(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.messagesService.markAsRead(userId, { jobId });
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cleanup old messages (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Old messages cleaned up successfully',
  })
  // @Roles('ADMIN') // Uncomment when roles guard is fully implemented
  async cleanupOldMessages() {
    return this.messagesService.cleanupOldMessages();
  }
}
