import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesRepository, MessageWithUsers, ConversationSummary } from './messages.repository';
import { CreateMessageDto, MessageType } from './dto/create-message.dto';
import { MessageQueryDto, MarkAsReadDto, TypingIndicatorDto } from './dto/message-query.dto';
import { LoggingService } from '../../common/logging/logging.service';
import * as crypto from 'crypto';

export interface MessageEncryption {
  algorithm: string;
  key: Buffer;
  iv: Buffer;
}

export interface TypingStatus {
  userId: string;
  jobId: string;
  isTyping: boolean;
  timestamp: Date;
}

@Injectable()
export class MessagesService {
  private readonly encryptionAlgorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;
  private typingStatuses: Map<string, TypingStatus> = new Map();
  private profanityFilter: string[] = [
    // Add profanity words here for filtering
    'spam', 'scam', 'fake', 'fraud'
  ];

  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly logger: LoggingService,
  ) {
    // Initialize encryption key from environment or generate one
    const keyString = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(keyString, 'hex');
  }

  async createMessage(senderId: string, data: CreateMessageDto): Promise<MessageWithUsers> {
    try {
      // Validate that sender can communicate in this job
      const canAccess = await this.messagesRepository.canUserAccessConversation(senderId, data.jobId);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to send messages in this conversation');
      }

      // Filter profanity and spam
      const filteredContent = this.filterContent(data.content);
      if (filteredContent !== data.content) {
        this.logger.warn('Message content filtered', 'MessagesService');
      }

      // Encrypt sensitive messages if needed
      let encryptedContent: string | undefined;
      if (this.shouldEncryptMessage(data)) {
        encryptedContent = this.encryptMessage(filteredContent);
      }

      const messageData = {
        ...data,
        content: filteredContent,
      };

      const message = await this.messagesRepository.create(
        senderId,
        messageData,
        encryptedContent,
      );

      // Clear typing status for sender
      this.clearTypingStatus(senderId, data.jobId);

      this.logger.log('Message created successfully', 'MessagesService');

      return message;
    } catch (error) {
      this.logger.error('Failed to create message: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async getMessages(userId: string, query: MessageQueryDto): Promise<{
    messages: MessageWithUsers[];
    total: number;
    hasNext: boolean;
    page: number;
    limit: number;
  }> {
    try {
      const result = await this.messagesRepository.findMessages(userId, query);

      // Decrypt messages if needed
      const decryptedMessages = result.messages.map(message => {
        // Check if message content looks encrypted (contains ':' separator from IV)
        const looksEncrypted = message.content.includes(':') && message.content.split(':').length === 2;
        if (looksEncrypted && (message.senderId === userId || message.receiverId === userId)) {
          try {
            message.content = this.decryptMessage(message.content);
          } catch (error) {
            this.logger.warn('Failed to decrypt message: ' + error.message, 'MessagesService');
            message.content = '[Encrypted message - unable to decrypt]';
          }
        }
        return message;
      });

      return {
        ...result,
        messages: decryptedMessages,
        page: query.page || 1,
        limit: query.limit || 50,
      };
    } catch (error) {
      this.logger.error('Failed to get messages: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async getConversations(userId: string): Promise<ConversationSummary[]> {
    try {
      const conversations = await this.messagesRepository.findConversations(userId);

      // Decrypt last messages if needed
      const decryptedConversations = conversations.map(conv => {
        // Note: We can't easily determine if the last message is encrypted without additional queries
        // For now, we'll assume last messages in conversations are not encrypted for performance
        return conv;
      });

      return decryptedConversations;
    } catch (error) {
      this.logger.error('Failed to get conversations: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async markAsRead(userId: string, data: MarkAsReadDto): Promise<{ updatedCount: number }> {
    try {
      if (!data.messageId && !data.messageIds && !data.jobId) {
        throw new BadRequestException('Either messageId, messageIds, or jobId must be provided');
      }

      // Handle messageIds array by processing each message
      if (data.messageIds && data.messageIds.length > 0) {
        let totalUpdated = 0;
        for (const msgId of data.messageIds) {
          const count = await this.messagesRepository.markAsRead(userId, msgId, undefined);
          totalUpdated += count;
        }
        this.logger.log(`${totalUpdated} messages marked as read from array`, 'MessagesService');
        return { updatedCount: totalUpdated };
      }

      const updatedCount = await this.messagesRepository.markAsRead(
        userId,
        data.messageId,
        data.jobId,
      );

      this.logger.log('Messages marked as read', 'MessagesService');

      return { updatedCount };
    } catch (error) {
      this.logger.error('Failed to mark messages as read: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async getUnreadCount(userId: string, jobId?: string): Promise<{ count: number }> {
    try {
      const count = await this.messagesRepository.getUnreadCount(userId, jobId);
      return { count };
    } catch (error) {
      this.logger.error('Failed to get unread count: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async updateTypingStatus(userId: string, data: TypingIndicatorDto): Promise<void> {
    try {
      // Validate that user can communicate in this job
      const canAccess = await this.messagesRepository.canUserAccessConversation(userId, data.jobId);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to communicate in this conversation');
      }

      const key = `${userId}-${data.jobId}`;
      
      if (data.isTyping) {
        this.typingStatuses.set(key, {
          userId,
          jobId: data.jobId,
          isTyping: true,
          timestamp: new Date(),
        });

        // Auto-clear typing status after 5 seconds
        setTimeout(() => {
          this.clearTypingStatus(userId, data.jobId);
        }, 5000);
      } else {
        this.clearTypingStatus(userId, data.jobId);
      }
    } catch (error) {
      this.logger.error('Failed to update typing status: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async getTypingStatuses(jobId: string, excludeUserId: string): Promise<TypingStatus[]> {
    try {
      const statuses: TypingStatus[] = [];
      
      for (const [key, status] of this.typingStatuses.entries()) {
        if (status.jobId === jobId && status.userId !== excludeUserId && status.isTyping) {
          // Remove expired typing statuses (older than 10 seconds)
          const now = new Date();
          const timeDiff = now.getTime() - status.timestamp.getTime();
          
          if (timeDiff > 10000) {
            this.typingStatuses.delete(key);
          } else {
            statuses.push(status);
          }
        }
      }

      return statuses;
    } catch (error) {
      this.logger.error('Failed to get typing statuses: ' + error.message, error.stack, 'MessagesService');
      return [];
    }
  }

  async validateFileUpload(file: any): Promise<boolean> {
    try {
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('File type not allowed');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('File size too large. Maximum size is 5MB');
      }

      return true;
    } catch (error) {
      this.logger.error('File validation failed: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async reportMessage(userId: string, messageId: string, reason: string): Promise<void> {
    try {
      // This would typically create a report record for admin review
      this.logger.warn(`Message reported by user ${userId}: ${messageId} - ${reason}`, 'MessagesService');
      
      // For now, just log the report. In a full implementation, 
      // you would create a report record in the database
    } catch (error) {
      this.logger.error('Failed to report message: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      // This would typically create a block relationship in the database
      this.logger.log(`User ${userId} blocked user ${blockedUserId}`, 'MessagesService');
      
      // For now, just log the action. In a full implementation,
      // you would create a user_blocks table
    } catch (error) {
      this.logger.error('Failed to block user: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  async cleanupOldMessages(): Promise<{ deletedCount: number }> {
    try {
      const daysToKeep = parseInt(process.env.MESSAGE_RETENTION_DAYS || '90');
      const deletedCount = await this.messagesRepository.deleteOldMessages(daysToKeep);

      this.logger.log(`Cleaned up ${deletedCount} old messages`, 'MessagesService');

      return { deletedCount };
    } catch (error) {
      this.logger.error('Failed to cleanup old messages: ' + error.message, error.stack, 'MessagesService');
      throw error;
    }
  }

  private clearTypingStatus(userId: string, jobId: string): void {
    const key = `${userId}-${jobId}`;
    this.typingStatuses.delete(key);
  }

  private filterContent(content: string): string {
    let filteredContent = content;

    // Filter profanity
    for (const word of this.profanityFilter) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }

    // Remove excessive whitespace
    filteredContent = filteredContent.trim().replace(/\s+/g, ' ');

    return filteredContent;
  }

  private shouldEncryptMessage(data: CreateMessageDto): boolean {
    // Encrypt messages containing sensitive information
    const sensitiveKeywords = ['bank', 'account', 'payment', 'card', 'ssn', 'id number'];
    const content = data.content.toLowerCase();

    return sensitiveKeywords.some(keyword => content.includes(keyword));
  }

  // Method to get repository (for testing purposes)
  getMessagesRepository() {
    return this.messagesRepository;
  }

  private encryptMessage(content: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV and encrypted content
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Failed to encrypt message: ' + error.message, error.stack, 'MessagesService');
      throw new Error('Message encryption failed');
    }
  }

  private decryptMessage(encryptedContent: string): string {
    try {
      const [ivHex, encrypted] = encryptedContent.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt message: ' + error.message, error.stack, 'MessagesService');
      throw new Error('Message decryption failed');
    }
  }
}
