import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { MessageType as PrismaMessageType } from '@prisma/client';
import { CreateMessageDto, MessageType } from './dto/create-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

export interface MessageWithUsers {
  id: string;
  content: string;
  messageType: PrismaMessageType;
  attachments: string[];
  isRead: boolean;
  readAt: Date | null;
  senderId: string;
  receiverId: string;
  jobId: string;
  createdAt: Date;
  sender: {
    id: string;
    email: string;
    role: string;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: {
      firstName: string | null;
      lastName: string | null;
      profilePictureUrl: string | null;
    } | null;
  };
  receiver: {
    id: string;
    email: string;
    role: string;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: {
      firstName: string | null;
      lastName: string | null;
      profilePictureUrl: string | null;
    } | null;
  };
  job: {
    id: string;
    title: string;
    status: string;
  };
}

export interface ConversationSummary {
  jobId: string;
  jobTitle: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  totalMessages: number;
}

@Injectable()
export class MessagesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {}

  async create(
    senderId: string,
    data: CreateMessageDto,
    encryptedContent?: string,
  ): Promise<MessageWithUsers> {
    try {
      const messageType: PrismaMessageType = data.type
        ? (data.type === MessageType.FILE ? 'DOCUMENT' : data.type as PrismaMessageType)
        : 'TEXT';

      const message = await this.prisma.message.create({
        data: {
          senderId,
          receiverId: data.recipientId,
          jobId: data.jobId,
          content: encryptedContent || data.content,
          messageType,
          attachments: data.fileUrl ? [data.fileUrl] : [],
          isRead: false,
        },
        include: {
          sender: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePictureUrl: true,
                },
              },
            },
          },
          receiver: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePictureUrl: true,
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      this.logger.log('Message created successfully', 'MessagesRepository');

      return message as MessageWithUsers;
    } catch (error) {
      this.logger.error('Failed to create message: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async findMessages(
    userId: string,
    query: MessageQueryDto,
  ): Promise<{ messages: MessageWithUsers[]; total: number; hasNext: boolean }> {
    try {
      const where: any = {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };

      if (query.jobId) {
        where.jobId = query.jobId;
      }

      if (query.userId) {
        where.OR = [
          { senderId: query.userId, receiverId: userId },
          { senderId: userId, receiverId: query.userId },
        ];
      }

      if (query.type) {
        where.messageType = query.type;
      }

      if (query.search) {
        where.content = {
          contains: query.search,
          mode: 'insensitive',
        };
      }

      if (query.fromDate || query.toDate) {
        where.createdAt = {};
        if (query.fromDate) {
          where.createdAt.gte = new Date(query.fromDate);
        }
        if (query.toDate) {
          where.createdAt.lte = new Date(query.toDate);
        }
      }

      if (query.unreadOnly) {
        where.isRead = false;
        where.receiverId = userId; // Only show unread messages sent to user
      }

      const limit = query.limit || 50;
      const skip = ((query.page || 1) - 1) * limit;

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          include: {
            sender: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePictureUrl: true,
                  },
                },
              },
            },
            receiver: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePictureUrl: true,
                  },
                },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip,
        }),
        this.prisma.message.count({ where }),
      ]);

      return {
        messages: messages as MessageWithUsers[],
        total,
        hasNext: skip + messages.length < total,
      };
    } catch (error) {
      this.logger.error('Failed to find messages: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async findConversations(userId: string): Promise<ConversationSummary[]> {
    try {
      const conversations = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT
          m.job_id,
          j.title as job_title,
          CASE
            WHEN m.sender_id = ${userId} THEN m.receiver_id
            ELSE m.sender_id
          END as participant_id,
          CASE
            WHEN m.sender_id = ${userId} THEN CONCAT(rp.first_name, ' ', rp.last_name)
            ELSE CONCAT(sp.first_name, ' ', sp.last_name)
          END as participant_name,
          CASE
            WHEN m.sender_id = ${userId} THEN rp.profile_picture_url
            ELSE sp.profile_picture_url
          END as participant_avatar,
          latest.content as last_message,
          latest.created_at as last_message_at,
          COALESCE(unread_count.count, 0) as unread_count,
          COALESCE(total_count.count, 0) as total_messages
        FROM messages m
        INNER JOIN jobs j ON m.job_id = j.id
        LEFT JOIN profiles sp ON m.sender_id = sp.user_id
        LEFT JOIN profiles rp ON m.receiver_id = rp.user_id
        INNER JOIN (
          SELECT
            job_id,
            CASE
              WHEN sender_id = ${userId} THEN receiver_id
              ELSE sender_id
            END as other_user_id,
            content,
            created_at,
            ROW_NUMBER() OVER (
              PARTITION BY job_id,
                CASE
                  WHEN sender_id = ${userId} THEN receiver_id
                  ELSE sender_id
                END
              ORDER BY created_at DESC
            ) as rn
          FROM messages
          WHERE sender_id = ${userId} OR receiver_id = ${userId}
        ) latest ON m.job_id = latest.job_id
          AND (
            (m.sender_id = ${userId} AND m.receiver_id = latest.other_user_id) OR
            (m.receiver_id = ${userId} AND m.sender_id = latest.other_user_id)
          )
          AND latest.rn = 1
        LEFT JOIN (
          SELECT
            job_id,
            sender_id as other_user_id,
            COUNT(*) as count
          FROM messages
          WHERE receiver_id = ${userId} AND is_read = false
          GROUP BY job_id, sender_id
        ) unread_count ON m.job_id = unread_count.job_id
          AND ((m.sender_id = ${userId} AND m.receiver_id = unread_count.other_user_id) OR
               (m.receiver_id = ${userId} AND m.sender_id = unread_count.other_user_id))
        LEFT JOIN (
          SELECT
            job_id,
            CASE
              WHEN sender_id = ${userId} THEN receiver_id
              ELSE sender_id
            END as other_user_id,
            COUNT(*) as count
          FROM messages
          WHERE sender_id = ${userId} OR receiver_id = ${userId}
          GROUP BY job_id, other_user_id
        ) total_count ON m.job_id = total_count.job_id
          AND ((m.sender_id = ${userId} AND m.receiver_id = total_count.other_user_id) OR
               (m.receiver_id = ${userId} AND m.sender_id = total_count.other_user_id))
        WHERE (m.sender_id = ${userId} OR m.receiver_id = ${userId})
        ORDER BY latest.created_at DESC
      `;

      return conversations.map(conv => ({
        jobId: conv.job_id,
        jobTitle: conv.job_title,
        participantId: conv.participant_id,
        participantName: conv.participant_name,
        participantAvatar: conv.participant_avatar,
        lastMessage: conv.last_message,
        lastMessageAt: new Date(conv.last_message_at),
        unreadCount: parseInt(conv.unread_count) || 0,
        totalMessages: parseInt(conv.total_messages) || 0,
      }));
    } catch (error) {
      this.logger.error('Failed to find conversations: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async markAsRead(userId: string, messageId?: string, jobId?: string): Promise<number> {
    try {
      const where: any = {
        receiverId: userId,
        isRead: false,
      };

      if (messageId) {
        where.id = messageId;
      } else if (jobId) {
        where.jobId = jobId;
      } else {
        throw new Error('Either messageId or jobId must be provided');
      }

      const result = await this.prisma.message.updateMany({
        where,
        data: {
          isRead: true,
        },
      });

      this.logger.log('Messages marked as read', 'MessagesRepository');

      return result.count;
    } catch (error) {
      this.logger.error('Failed to mark messages as read: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async getUnreadCount(userId: string, jobId?: string): Promise<number> {
    try {
      const where: any = {
        receiverId: userId,
        isRead: false,
      };

      if (jobId) {
        where.jobId = jobId;
      }

      const count = await this.prisma.message.count({ where });

      return count;
    } catch (error) {
      this.logger.error('Failed to get unread count: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async deleteOldMessages(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.message.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log('Old messages deleted', 'MessagesRepository');

      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete old messages: ' + error.message, error.stack, 'MessagesRepository');
      throw error;
    }
  }

  async canUserAccessConversation(userId: string, jobId: string): Promise<boolean> {
    try {
      // Check if user is either the job client or has an accepted bid
      const job = await this.prisma.job.findFirst({
        where: {
          id: jobId,
          OR: [
            { clientId: userId },
            {
              bids: {
                some: {
                  artisanId: userId,
                  status: 'ACCEPTED',
                },
              },
            },
          ],
        },
      });

      return !!job;
    } catch (error) {
      this.logger.error('Failed to check conversation access: ' + error.message, error.stack, 'MessagesRepository');
      return false;
    }
  }
}
