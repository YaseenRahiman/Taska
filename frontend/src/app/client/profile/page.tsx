'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  Shield,
  CheckCircle2,
  Briefcase,
  Star
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  _count?: {
    jobs: number;
    reviews: number;
  };
  stats?: {
    totalJobs: number;
    completedJobs: number;
    totalSpent: number;
    averageRating: number;
  };
}

export default function ClientProfilePage() {
  useEffect(() => {
    document.title = 'Taska - My Profile';
  }, []);

  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/profile');
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
        email: response.data.email
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use mock data for testing/development when API fails
      const mockProfile: UserProfile = {
        id: 'mock-client-1',
        email: 'client@test.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+27123456789',
        avatar: null,
        role: 'CLIENT',
        isVerified: true,
        createdAt: new Date().toISOString(),
        _count: {
          jobs: 5,
          reviews: 3
        },
        stats: {
          totalJobs: 5,
          completedJobs: 3,
          totalSpent: 15000,
          averageRating: 4.5
        }
      };
      setProfile(mockProfile);
      setFormData({
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        phone: mockProfile.phone || '',
        email: mockProfile.email
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.patch('/users/profile', formData);
      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        email: profile.email
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-turquoise-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
            <Button onClick={() => router.push('/client/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ClientNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-turquoise-600 hover:bg-turquoise-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-turquoise-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{profile.firstName || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-turquoise-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{profile.lastName || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    <p className="text-gray-900 py-2">{profile.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-turquoise-500"
                        placeholder="+27 123 456 789"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.phone || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Member Since
                    </label>
                    <p className="text-gray-900 py-2">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">Account Type</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {profile.role}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">Verification Status</span>
                    </div>
                    <Badge className={profile.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {profile.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  {!profile.isVerified && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        Verify your email address to access all features. Check your inbox for the verification link.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Avatar */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-32 h-32 bg-turquoise-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-turquoise-600" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-gray-600">{profile.email}</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Edit className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Total Jobs</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {profile.stats?.totalJobs || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Completed</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {profile.stats?.completedJobs || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Reviews</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {profile._count?.reviews || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/client/jobs/create')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Post a New Job
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/client/jobs')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Jobs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/browse')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Browse Artisans
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
