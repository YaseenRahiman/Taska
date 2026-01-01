'use client'

import React, { useState, useEffect } from 'react'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import {
  MessageCircle,
  Search,
  Send,
  User,
  Clock,
  CheckCheck,
  Check,
  Paperclip,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  jobId?: string
  createdAt: string
  read: boolean
}

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantRole: 'CLIENT' | 'ARTISAN'
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  jobTitle?: string
  jobId?: string
}

export default function ArtisanMessages() {
  useEffect(() => {
    document.title = 'Taska - Messages';
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participantId)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/messages/conversations')

      // Mock conversations data
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participantId: 'client-1',
          participantName: 'Sarah Miller',
          participantRole: 'CLIENT',
          lastMessage: 'Thanks for the quick response! When can you start?',
          lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          unreadCount: 2,
          jobTitle: 'Kitchen Sink Repair',
          jobId: 'job-1'
        },
        {
          id: '2',
          participantId: 'client-2',
          participantName: 'John Davidson',
          participantRole: 'CLIENT',
          lastMessage: 'The electrical work looks great. Can you send me the invoice?',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          jobTitle: 'Bedroom Electrical Installation',
          jobId: 'job-2'
        },
        {
          id: '3',
          participantId: 'client-3',
          participantName: 'Mike Chen',
          participantRole: 'CLIENT',
          lastMessage: 'I have some questions about the project timeline.',
          lastMessageAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          unreadCount: 1,
          jobTitle: 'Custom Kitchen Cabinets',
          jobId: 'job-3'
        }
      ]

      setConversations(response.data || mockConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (participantId: string) => {
    try {
      const response = await api.get(`/messages/${participantId}`)

      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hi, I saw your bid on my kitchen sink repair job.',
          senderId: participantId,
          receiverId: 'artisan-1',
          jobId: 'job-1',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '2',
          content: 'Hello! Yes, I can help with that. I have experience with similar jobs.',
          senderId: 'artisan-1',
          receiverId: participantId,
          jobId: 'job-1',
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '3',
          content: 'Great! What time works best for you to come assess the situation?',
          senderId: participantId,
          receiverId: 'artisan-1',
          jobId: 'job-1',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '4',
          content: 'I can come tomorrow morning around 9 AM if that works for you.',
          senderId: 'artisan-1',
          receiverId: participantId,
          jobId: 'job-1',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '5',
          content: 'Thanks for the quick response! When can you start?',
          senderId: participantId,
          receiverId: 'artisan-1',
          jobId: 'job-1',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false
        }
      ]

      setMessages(response.data || mockMessages)

      // Mark messages as read
      if (mockMessages.some(m => !m.read && m.receiverId === 'artisan-1')) {
        await api.put(`/messages/mark-read/${participantId}`)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    try {
      setSending(true)
      await api.post('/messages', {
        receiverId: selectedConversation.participantId,
        content: newMessage,
        jobId: selectedConversation.jobId
      })

      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: 'artisan-1',
        receiverId: selectedConversation.participantId,
        jobId: selectedConversation.jobId,
        createdAt: new Date().toISOString(),
        read: false
      }

      setMessages([...messages, newMsg])
      setNewMessage('')

      // Update conversation last message
      setConversations(conversations.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: newMessage, lastMessageAt: new Date().toISOString() }
          : conv
      ))
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Communicate with clients about your projects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-16rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto h-[calc(100%-8rem)]">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{conv.participantName}</h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            </div>
                            {conv.jobTitle && (
                              <p className="text-xs text-gray-600 mb-1 truncate">{conv.jobTitle}</p>
                            )}
                            <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <div className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-16rem)] flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-semibold text-gray-900">{selectedConversation.participantName}</h2>
                        {selectedConversation.jobTitle && (
                          <p className="text-sm text-gray-600">{selectedConversation.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isSent = message.senderId === 'artisan-1'
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isSent
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div
                              className={`flex items-center gap-1 justify-end mt-1 text-xs ${
                                isSent ? 'text-primary-100' : 'text-gray-500'
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>
                              {isSent && (
                                message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex items-end gap-2">
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <Paperclip className="w-5 h-5 text-gray-500" />
                      </Button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder="Type your message..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          rows={2}
                        />
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-primary-600 hover:bg-primary-700 flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
