import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NotificationEventDto,
  MetricsUpdateDto,
  ActivityFeedItemDto,
  SystemAlertDto,
  MetricsSubscriptionDto,
} from '../dto/notification.dto';

/**
 * WebSocket Gateway for real-time admin features
 *
 * Handles:
 * - Real-time notifications
 * - Live metrics updates
 * - Activity feed
 * - System alerts
 * - Bidirectional communication
 *
 * Connection URL: ws://localhost:3000/admin
 * Requires JWT authentication
 */
/**
 * Parse CORS origins from environment, supporting multiple origins and local network access
 */
function getCorsOrigins(): string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) {
  const frontendUrl = process.env.FRONTEND_URL;
  const corsOrigin = process.env.CORS_ORIGIN;

  // Build allowed origins list
  const allowedOrigins = new Set<string>();
  if (frontendUrl) allowedOrigins.add(frontendUrl);
  if (corsOrigin) corsOrigin.split(',').forEach(o => allowedOrigins.add(o.trim()));

  // Default development origins
  if (allowedOrigins.size === 0) {
    allowedOrigins.add('http://localhost:3001');
    allowedOrigins.add('http://localhost:3000');
  }

  // Return a function that also allows local network IPs
  return (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOrigins.has(origin);
    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);

    callback(null, isAllowed || isLocalNetwork);
  };
}

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class AdminGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);
  private readonly connectedAdmins = new Map<string, string>(); // socketId -> userId
  private readonly heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gateway initialization hook
   */
  afterInit(server: Server) {
    this.logger.log('Admin WebSocket Gateway initialized');
    this.logger.log(`Namespace: /admin`);
    this.logger.log(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  }

  /**
   * Handle client connection
   *
   * Authenticates the client using JWT token
   * Joins admin room for broadcasting
   * Sets up heartbeat mechanism
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connecting: ${client.id}`);

      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1] ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No authentication token`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      let payload: any;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.warn(`Client ${client.id} rejected: Invalid token`);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }

      // Verify user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, email: true },
      });

      if (!user || user.role !== 'ADMIN') {
        this.logger.warn(
          `Client ${client.id} rejected: User ${payload.sub} is not admin`,
        );
        client.emit('error', { message: 'Admin access required' });
        client.disconnect();
        return;
      }

      // Store connection
      this.connectedAdmins.set(client.id, user.id);

      // Join admin room
      client.join('admin-room');

      // Setup heartbeat
      this.setupHeartbeat(client);

      // Send connection success
      client.emit('connected', {
        message: 'Successfully connected to admin gateway',
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
      });

      this.logger.log(
        `Admin connected: ${user.email} (${user.id}) - Socket: ${client.id}`,
      );
      this.logger.log(`Total connected admins: ${this.connectedAdmins.size}`);

      // Broadcast admin connection event to other admins
      client.to('admin-room').emit('admin:connected', {
        adminEmail: user.email,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error.stack);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = this.connectedAdmins.get(client.id);

    // Clear heartbeat
    const interval = this.heartbeatIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(client.id);
    }

    // Remove from connected admins
    this.connectedAdmins.delete(client.id);

    this.logger.log(`Admin disconnected: User ${userId} - Socket: ${client.id}`);
    this.logger.log(`Total connected admins: ${this.connectedAdmins.size}`);

    // Broadcast admin disconnection event
    if (userId) {
      client.to('admin-room').emit('admin:disconnected', {
        userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Setup heartbeat mechanism to detect dead connections
   */
  private setupHeartbeat(client: Socket) {
    const interval = setInterval(() => {
      client.emit('heartbeat', { timestamp: new Date() });
    }, 30000); // Every 30 seconds

    this.heartbeatIntervals.set(client.id, interval);

    // Listen for pong response
    client.on('pong', () => {
      // Connection is alive
    });
  }

  /**
   * Handle subscription to specific metrics
   */
  @SubscribeMessage('metrics:subscribe')
  handleMetricsSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MetricsSubscriptionDto,
  ) {
    this.logger.log(`Admin ${client.id} subscribed to metrics: ${data.metrics.join(', ')}`);

    // Join metric-specific rooms
    data.metrics.forEach((metric) => {
      client.join(`metrics:${metric}`);
    });

    client.emit('metrics:subscribed', {
      metrics: data.metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Handle unsubscription from metrics
   */
  @SubscribeMessage('metrics:unsubscribe')
  handleMetricsUnsubscribe(@ConnectedSocket() client: Socket) {
    this.logger.log(`Admin ${client.id} unsubscribed from all metrics`);

    // Leave all metric rooms
    const rooms = Array.from(client.rooms).filter((room) =>
      room.startsWith('metrics:'),
    );
    rooms.forEach((room) => {
      client.leave(room);
    });

    client.emit('metrics:unsubscribed', {
      timestamp: new Date(),
    });
  }

  /**
   * Handle notification read acknowledgment
   */
  @SubscribeMessage('notification:read')
  handleNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationIds: string[] },
  ) {
    const userId = this.connectedAdmins.get(client.id);
    this.logger.log(
      `Admin ${userId} marked ${data.notificationIds.length} notifications as read`,
    );

    // Acknowledge receipt
    client.emit('notification:read:ack', {
      notificationIds: data.notificationIds,
      timestamp: new Date(),
    });
  }

  /**
   * Handle clear all notifications
   */
  @SubscribeMessage('notification:clear-all')
  handleClearAllNotifications(@ConnectedSocket() client: Socket) {
    const userId = this.connectedAdmins.get(client.id);
    this.logger.log(`Admin ${userId} cleared all notifications`);

    client.emit('notification:clear-all:ack', {
      timestamp: new Date(),
    });
  }

  /**
   * Emit new notification to specific user
   *
   * Called by other services when creating notifications
   */
  emitNotification(userId: string, notification: NotificationEventDto) {
    try {
      // Find sockets for this user
      const userSockets = Array.from(this.connectedAdmins.entries())
        .filter(([_, uid]) => uid === userId)
        .map(([socketId]) => socketId);

      if (userSockets.length === 0) {
        this.logger.debug(`User ${userId} not connected, notification queued`);
        return;
      }

      // Emit to all user's sockets
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit('notification:new', notification);
      });

      this.logger.log(`Notification sent to user ${userId} (${userSockets.length} sockets)`);
    } catch (error) {
      this.logger.error(`Failed to emit notification to user ${userId}`, error.stack);
    }
  }

  /**
   * Emit notification to all connected admins
   */
  emitToAdmins(event: string, data: any) {
    try {
      this.server.to('admin-room').emit(event, {
        ...data,
        timestamp: new Date(),
      });

      this.logger.log(`Event "${event}" emitted to admin room`);
    } catch (error) {
      this.logger.error(`Failed to emit event "${event}" to admins`, error.stack);
    }
  }

  /**
   * Emit metrics update to subscribed admins
   */
  emitMetricsUpdate(metrics: MetricsUpdateDto) {
    try {
      // Emit to admin room
      this.server.to('admin-room').emit('metrics:update', metrics);

      this.logger.debug('Metrics update emitted to admins');
    } catch (error) {
      this.logger.error('Failed to emit metrics update', error.stack);
    }
  }

  /**
   * Emit activity feed item
   */
  emitActivity(activity: ActivityFeedItemDto) {
    try {
      this.server.to('admin-room').emit('activity:new', activity);

      this.logger.debug(`Activity emitted: ${activity.type}`);
    } catch (error) {
      this.logger.error('Failed to emit activity', error.stack);
    }
  }

  /**
   * Emit system alert
   */
  emitSystemAlert(alert: SystemAlertDto) {
    try {
      this.server.to('admin-room').emit('system:alert', alert);

      this.logger.log(`System alert emitted: ${alert.severity} - ${alert.message}`);
    } catch (error) {
      this.logger.error('Failed to emit system alert', error.stack);
    }
  }

  /**
   * Emit bulk operation progress update
   */
  emitBulkOperationProgress(data: {
    operationId: string;
    progress: number;
    status: string;
    processedCount?: number;
    totalCount?: number;
  }) {
    try {
      this.server.to('admin-room').emit('bulk-operation:progress', {
        ...data,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Bulk operation progress: ${data.operationId} - ${data.progress}%`,
      );
    } catch (error) {
      this.logger.error('Failed to emit bulk operation progress', error.stack);
    }
  }

  /**
   * Emit report generation status update
   */
  emitReportStatus(data: {
    reportId: string;
    executionId: string;
    status: string;
    progress?: number;
  }) {
    try {
      this.server.to('admin-room').emit('report:status', {
        ...data,
        timestamp: new Date(),
      });

      this.logger.debug(`Report status: ${data.reportId} - ${data.status}`);
    } catch (error) {
      this.logger.error('Failed to emit report status', error.stack);
    }
  }

  /**
   * Get connected admins count
   */
  getConnectedAdminsCount(): number {
    return this.connectedAdmins.size;
  }

  /**
   * Get connected admin user IDs
   */
  getConnectedAdminIds(): string[] {
    return Array.from(new Set(this.connectedAdmins.values()));
  }

  /**
   * Check if a specific user is connected
   */
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedAdmins.values()).includes(userId);
  }
}
