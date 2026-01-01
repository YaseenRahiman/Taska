'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Shield,
  Ban,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
  verified: boolean;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    city: string;
    province: string;
  };
  activityLogs: any[];
  _count: {
    jobs: number;
    bids: number;
  };
}

interface UserFilters {
  role?: string;
  status?: string;
  verified?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  take?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({ take: 20, skip: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/admin/users?${queryParams}`);
      setUsers(response.data.users || []);
      setTotalUsers(response.data.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Users loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleUserAction = async (userId: string, action: string, reason?: string, suspendUntil?: Date) => {
    try {
      setActionLoading(`${action}_${userId}`);
      
      let endpoint = '';
      let payload: any = {};
      
      switch (action) {
        case 'ban':
          endpoint = `/admin/users/${userId}/ban`;
          payload = { reason: reason || 'Violated platform terms' };
          break;
        case 'suspend':
          endpoint = `/admin/users/${userId}/suspend`;
          payload = { reason: reason || 'Temporary suspension', suspendUntil };
          break;
        case 'verify':
          endpoint = `/admin/users/${userId}/verify`;
          break;
        case 'reset-password':
          endpoint = `/admin/users/${userId}/reset-password`;
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api.post(endpoint, payload);
      
      // Show success message
      alert(response.data.message || 'Action completed successfully');
      
      // Refresh user list
      await fetchUsers();
      
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'ARTISAN': return 'bg-blue-100 text-blue-800';
      case 'CLIENT': return 'bg-green-100 text-green-800';
      case 'ASSESSOR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'BANNED': return 'bg-red-100 text-red-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'SUSPENDED': return <Clock className="w-4 h-4" />;
      case 'BANNED': return <XCircle className="w-4 h-4" />;
      case 'INACTIVE': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage platform users, verification, and account status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4 mb-6 border-0 shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, skip: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="CLIENT">Client</option>
                  <option value="ARTISAN">Artisan</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ASSESSOR">Assessor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, skip: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                <select
                  value={filters.verified?.toString() || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    verified: e.target.value === '' ? undefined : e.target.value === 'true',
                    skip: 0 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Email or name..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, skip: 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* User List */}
        <Card className="border-0 shadow-sm bg-white">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Users ({totalUsers.toLocaleString()})
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Showing {users.length} of {totalUsers}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {user.profile?.firstName} {user.profile?.lastName}
                            </div>
                            {user.verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.profile?.phoneNumber && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.profile.phoneNumber}
                            </div>
                          )}
                          {user.profile?.city && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.profile.city}, {user.profile.province}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Badge className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          {user.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col gap-1">
                        <span>{user._count?.jobs || 0} jobs</span>
                        <span className="text-xs text-gray-500">{user._count?.bids || 0} bids</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {user.role === 'ARTISAN' && !user.verified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'verify')}
                            disabled={actionLoading === `verify_${user.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}

                        {user.status === 'ACTIVE' && user.role !== 'ADMIN' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter suspension reason:');
                                if (reason) handleUserAction(user.id, 'suspend', reason);
                              }}
                              disabled={actionLoading === `suspend_${user.id}`}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter ban reason:');
                                if (reason && confirm('Are you sure you want to ban this user?')) {
                                  handleUserAction(user.id, 'ban', reason);
                                }
                              }}
                              disabled={actionLoading === `ban_${user.id}`}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Generate new temporary password for this user?')) {
                              handleUserAction(user.id, 'reset-password');
                            }
                          }}
                          disabled={actionLoading === `reset-password_${user.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(filters.skip || 0) + 1} to {Math.min((filters.skip || 0) + (filters.take || 20), totalUsers)} of {totalUsers} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ ...filters, skip: Math.max(0, (filters.skip || 0) - (filters.take || 20)) })}
                  disabled={!filters.skip || filters.skip <= 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ ...filters, skip: (filters.skip || 0) + (filters.take || 20) })}
                  disabled={(filters.skip || 0) + (filters.take || 20) >= totalUsers}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* User Detail Modal (simplified for now) */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Details</h3>
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                  ×
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Role:</span> {selectedUser.role}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedUser.status}
                  </div>
                  <div>
                    <span className="font-medium">Verified:</span> {selectedUser.verified ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {selectedUser.profile?.phoneNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {selectedUser.profile.phoneNumber}
                  </div>
                )}
                {selectedUser.profile?.city && (
                  <div className="text-sm">
                    <span className="font-medium">Location:</span> {selectedUser.profile.city}, {selectedUser.profile.province}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
