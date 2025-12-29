'use client';

import { useState, useEffect, useRef } from 'react';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  User,
  Clock,
  CheckCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  isRead: boolean;
  jobId?: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  job?: {
    id: string;
    title: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export default function ClientMessagesPage() {
  useEffect(() => {
    document.title = 'Taska - Messages';
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/messages/conversations');
      setConversations(response.data || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      setError(null);
      // Fetch messages for this conversation/job
      const response = await api.get('/messages', {
        params: { conversationId }
      });
      setMessages(response.data || []);

      // Mark messages as read
      if (response.data && response.data.length > 0) {
        await api.post('/messages/mark-read', {
          conversationId
        });
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      setError(null);

      const response = await api.post('/messages', {
        recipientId: selectedConversation.otherUser.id,
        content: messageInput.trim(),
        jobId: selectedConversation.job?.id
      });

      // Add new message to the list
      setMessages([...messages, response.data]);
      setMessageInput('');

      // Refresh conversations to update last message
      fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">
            Communicate with artisans about your jobs
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 h-[calc(100vh-280px)]">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center p-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-400 text-sm mt-1">
                      Start by posting a job and receiving bids
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {conv.otherUser.avatar ? (
                            <img
                              src={conv.otherUser.avatar}
                              alt={conv.otherUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conv.otherUser.name}
                            </h3>
                            {conv.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(new Date(conv.lastMessage.createdAt))}
                              </span>
                            )}
                          </div>
                          {conv.job && (
                            <p className="text-xs text-primary-600 mb-1 truncate">
                              Re: {conv.job.title}
                            </p>
                          )}
                          {conv.lastMessage && (
                            <p className={`text-sm truncate ${
                              !conv.lastMessage.isRead && conv.unreadCount > 0
                                ? 'font-semibold text-gray-900'
                                : 'text-gray-600'
                            }`}>
                              {conv.lastMessage.content}
                            </p>
                          )}
                          {conv.unreadCount > 0 && (
                            <Badge className="mt-2 bg-primary-600 text-white">
                              {conv.unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2 h-[calc(100vh-280px)] flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {selectedConversation.otherUser.avatar ? (
                        <img
                          src={selectedConversation.otherUser.avatar}
                          alt={selectedConversation.otherUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.otherUser.name}
                      </h3>
                      {selectedConversation.job && (
                        <p className="text-sm text-gray-600">
                          {selectedConversation.job.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Start the conversation
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId !== selectedConversation.otherUser.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <Clock className="w-3 h-3 opacity-70" />
                              <span className="text-xs opacity-70">
                                {formatRelativeTime(new Date(message.createdAt))}
                              </span>
                              {isOwnMessage && message.isRead && (
                                <CheckCheck className="w-3 h-3 ml-1 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-gray-500">
                    Select a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
