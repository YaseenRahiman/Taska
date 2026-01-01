import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { TypingIndicatorDto } from './dto/message-query.dto';
import { LoggingService } from '../../common/logging/logging.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string[]>(); // userId -> socketIds[]
  private userRooms = new Map<string, Set<string>>(); // userId -> Set<jobIds>

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggingService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.email = payload.email;

      // Add user to connected users map
      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, []);
      }
      this.connectedUsers.get(client.userId)!.push(client.id);

      this.logger.log(`User ${client.userId} connected via WebSocket`, 'MessagesGateway');

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to messages',
        userId: client.userId,
      });

    } catch (error) {
      this.logger.error('WebSocket connection failed: ' + error.message, error.stack, 'MessagesGateway');
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from connected users
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        const index = userSockets.indexOf(client.id);
        if (index > -1) {
          userSockets.splice(index, 1);
        }
        
        if (userSockets.length === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }

      // Leave all rooms
      const userRoomSet = this.userRooms.get(client.userId);
      if (userRoomSet) {
        userRoomSet.forEach(jobId => {
          client.leave(`job:${jobId}`);
        });
        this.userRooms.delete(client.userId);
      }

      this.logger.log(`User ${client.userId} disconnected from WebSocket`, 'MessagesGateway');
    }
  }

  @SubscribeMessage('joinJobRoom')
  async handleJoinJobRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    try {
      if (!client.userId) {
        throw new UnauthorizedException('Not authenticated');
      }

      // Verify user has access to this job conversation
      const hasAccess = await this.messagesService.getMessagesRepository().canUserAccessConversation(
        client.userId,
        data.jobId,
      );

      if (!hasAccess) {
        client.emit('error', { message: 'Not authorized to access this conversation' });
        return;
      }

      // Join the room
      const roomName = `job:${data.jobId}`;
      client.join(roomName);

      // Track user rooms
      if (!this.userRooms.has(client.userId)) {
        this.userRooms.set(client.userId, new Set());
      }
      this.userRooms.get(client.userId)!.add(data.jobId);

      this.logger.log(`User ${client.userId} joined room ${roomName}`, 'MessagesGateway');

      client.emit('joinedRoom', { jobId: data.jobId, message: 'Joined conversation' });

    } catch (error) {
      this.logger.error('Failed to join job room: ' + error.message, error.stack, 'MessagesGateway');
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leaveJobRoom')
  async handleLeaveJobRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    try {
      if (!client.userId) {
        return;
      }

      const roomName = `job:${data.jobId}`;
      client.leave(roomName);

      // Remove from user rooms tracking
      const userRoomSet = this.userRooms.get(client.userId);
      if (userRoomSet) {
        userRoomSet.delete(data.jobId);
      }

      this.logger.log(`User ${client.userId} left room ${roomName}`, 'MessagesGateway');

      client.emit('leftRoom', { jobId: data.jobId, message: 'Left conversation' });

    } catch (error) {
      this.logger.error('Failed to leave job room: ' + error.message, error.stack, 'MessagesGateway');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      if (!client.userId) {
        throw new UnauthorizedException('Not authenticated');
      }

      // Create message through service
      const message = await this.messagesService.createMessage(client.userId, data);

      // Emit to all users in the job room
      const roomName = `job:${data.jobId}`;
      this.server.to(roomName).emit('newMessage', message);

      // Send confirmation to sender
      client.emit('messageSent', { 
        messageId: message.id,
        localId: data.localId, // If client sends a local ID for tracking
      });

      this.logger.log(`Message sent in room ${roomName}`, 'MessagesGateway');

    } catch (error) {
      this.logger.error('Failed to send message via WebSocket: ' + error.message, error.stack, 'MessagesGateway');
      client.emit('messageError', { 
        message: error.message,
        localId: data.localId,
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    try {
      if (!client.userId) {
        return;
      }

      // Update typing status through service
      await this.messagesService.updateTypingStatus(client.userId, data);

      // Emit typing indicator to other users in the room (exclude sender)
      const roomName = `job:${data.jobId}`;
      client.to(roomName).emit('userTyping', {
        userId: client.userId,
        jobId: data.jobId,
        isTyping: data.isTyping,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Failed to handle typing indicator: ' + error.message, error.stack, 'MessagesGateway');
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId?: string; jobId?: string },
  ) {
    try {
      if (!client.userId) {
        return;
      }

      // Mark messages as read through service
      const result = await this.messagesService.markAsRead(client.userId, data);

      // Emit read receipt to other users in the room
      if (data.jobId) {
        const roomName = `job:${data.jobId}`;
        client.to(roomName).emit('messagesRead', {
          userId: client.userId,
          jobId: data.jobId,
          messageId: data.messageId,
          readAt: new Date(),
        });
      }

      client.emit('markedAsRead', result);

    } catch (error) {
      this.logger.error('Failed to mark messages as read: ' + error.message, error.stack, 'MessagesGateway');
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId?: string },
  ) {
    try {
      if (!client.userId) {
        return;
      }

      const result = await this.messagesService.getUnreadCount(client.userId, data.jobId);
      client.emit('unreadCount', result);

    } catch (error) {
      this.logger.error('Failed to get unread count: ' + error.message, error.stack, 'MessagesGateway');
      client.emit('error', { message: 'Failed to get unread count' });
    }
  }

  // Helper method to emit to all user's connected sockets
  private emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Method to emit notifications (called from other parts of the application)
  async notifyUser(userId: string, notification: any) {
    this.emitToUser(userId, 'notification', notification);
  }

  // Method to notify about new messages (called from other parts of the application)
  async notifyNewMessage(jobId: string, message: any, excludeUserId?: string) {
    const roomName = `job:${jobId}`;
    
    if (excludeUserId) {
      // Get all users in room except the sender
      const room = this.server.sockets.adapter.rooms.get(roomName);
      if (room) {
        room.forEach(socketId => {
          const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
          if (socket && socket.userId !== excludeUserId) {
            socket.emit('newMessage', message);
          }
        });
      }
    } else {
      this.server.to(roomName).emit('newMessage', message);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get users in a job room
  getUsersInJobRoom(jobId: string): string[] {
    const roomName = `job:${jobId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const userIds: string[] = [];

    if (room) {
      room.forEach(socketId => {
        const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
        if (socket && socket.userId) {
          userIds.push(socket.userId);
        }
      });
    }

    return [...new Set(userIds)]; // Remove duplicates
  }
}
