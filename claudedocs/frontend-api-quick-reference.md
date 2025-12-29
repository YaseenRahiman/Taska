# Frontend API Quick Reference - Client Dashboard

## Base Configuration
```javascript
const API_BASE = 'http://localhost:3000/api';
const getHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
```

---

## 1. Authentication

### Login
```javascript
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { accessToken, refreshToken } = await response.json();
  localStorage.setItem('token', accessToken);
  return { accessToken, refreshToken };
};
```

### Logout
```javascript
const logout = async (token) => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  localStorage.removeItem('token');
};
```

### Get Current User
```javascript
const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

---

## 2. Categories

### Get All Categories
```javascript
const getCategories = async () => {
  const response = await fetch(`${API_BASE}/categories`);
  return response.json();
};
```

---

## 3. Image Upload

### Upload Single Image
```javascript
const uploadJobImage = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/jobs/upload-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  return response.json(); // { url, size, format }
};
```

### Upload Multiple Images
```javascript
const uploadJobImages = async (token, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch(`${API_BASE}/jobs/upload-images`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  return response.json(); // [{ url, size, format }, ...]
};
```

---

## 4. Job Management

### Create Job (Draft)
```javascript
const createJob = async (token, jobData) => {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      ...jobData,
      isDraft: true  // Save as draft
    })
  });
  return response.json();
};
```

### Publish Job
```javascript
const publishJob = async (token, jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/publish`, {
    method: 'PUT',
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Get My Jobs
```javascript
const getMyJobs = async (token) => {
  const response = await fetch(`${API_BASE}/jobs/my-jobs`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Get Job by ID
```javascript
const getJob = async (token, jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Update Job
```javascript
const updateJob = async (token, jobId, updates) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(updates)
  });
  return response.json();
};
```

### Delete Job
```javascript
const deleteJob = async (token, jobId) => {
  await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  // Returns 204 No Content
};
```

### Cancel Job
```javascript
const cancelJob = async (token, jobId, reason) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ reason })
  });
  return response.json();
};
```

### Complete Job
```javascript
const completeJob = async (token, jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/complete`, {
    method: 'PUT',
    headers: getHeaders(token)
  });
  return response.json();
};
```

---

## 5. Complete Workflow Example

### Full Job Creation Flow
```javascript
const createJobWorkflow = async (token, formData, imageFiles) => {
  try {
    // 1. Upload images
    const uploadedImages = await uploadJobImages(token, imageFiles);
    const imageUrls = uploadedImages.map(img => img.url);

    // 2. Create job as draft
    const job = await createJob(token, {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      budget: parseFloat(formData.budget),
      budgetType: formData.budgetType,
      urgency: formData.urgency,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      province: formData.province,
      postalCode: formData.postalCode,
      latitude: formData.latitude,
      longitude: formData.longitude,
      images: imageUrls,
      requirements: formData.requirements,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isDraft: true
    });

    // 3. Optionally publish immediately
    if (formData.publishNow) {
      await publishJob(token, job.id);
    }

    return job;
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};
```

---

## 6. React Hook Examples

### useAuth Hook
```javascript
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const loginUser = async (email, password) => {
    const { accessToken } = await login(email, password);
    setToken(accessToken);
    const userData = await getCurrentUser(accessToken);
    setUser(userData);
  };

  const logoutUser = async () => {
    await logout(token);
    setToken(null);
    setUser(null);
  };

  return { user, token, login: loginUser, logout: logoutUser };
};
```

### useJobs Hook
```javascript
const useJobs = (token) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getMyJobs(token);
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  const createNewJob = async (jobData, images) => {
    const job = await createJobWorkflow(token, jobData, images);
    setJobs([job, ...jobs]);
    return job;
  };

  const removeJob = async (jobId) => {
    await deleteJob(token, jobId);
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  return { jobs, loading, createJob: createNewJob, deleteJob: removeJob, refresh: fetchJobs };
};
```

### useCategories Hook
```javascript
const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
};
```

---

## 7. TypeScript Types

```typescript
interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  verifiedAt: string | null;
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  children?: Category[];
}

interface Job {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budget: number;
  budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  images: string[];
  requirements: string[];
  categoryId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  bids?: Bid[];
}

interface CreateJobDto {
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  images?: string[];
  requirements?: string[];
  startDate?: string;
  endDate?: string;
  isDraft?: boolean;
}

interface UploadedImage {
  url: string;
  size: number;
  format: string;
}
```

---

## 8. Error Handling

```javascript
const handleApiError = (error) => {
  if (error.statusCode === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  } else if (error.statusCode === 403) {
    // Forbidden - show permission error
    alert('You do not have permission to perform this action');
  } else if (error.statusCode === 400) {
    // Validation error - show field errors
    return error.errors || [{ message: error.message }];
  } else {
    // Generic error
    alert('An error occurred. Please try again.');
  }
};

// Usage in API calls
try {
  const job = await createJob(token, jobData);
} catch (error) {
  const errors = handleApiError(error);
  // Display errors in form
}
```

---

## 9. Validation Rules

```javascript
const jobValidation = {
  title: { min: 5, max: 100 },
  description: { min: 20, max: 2000 },
  budget: { min: 50, max: 100000 },
  images: { max: 5 },
  requirements: { max: 10, itemMax: 200 },
  postalCode: { max: 10 }
};

const validateJobForm = (data) => {
  const errors = {};

  if (data.title.length < 5) errors.title = 'Title must be at least 5 characters';
  if (data.description.length < 20) errors.description = 'Description must be at least 20 characters';
  if (data.budget < 50) errors.budget = 'Budget must be at least R50';
  if (data.images.length > 5) errors.images = 'Maximum 5 images allowed';

  return Object.keys(errors).length > 0 ? errors : null;
};
```

---

## 10. Status Badge Helper

```javascript
const getStatusColor = (status) => {
  const colors = {
    DRAFT: 'gray',
    OPEN: 'blue',
    IN_PROGRESS: 'yellow',
    COMPLETED: 'green',
    CANCELLED: 'red'
  };
  return colors[status] || 'gray';
};

const getStatusLabel = (status) => {
  const labels = {
    DRAFT: 'Draft',
    OPEN: 'Open for Bids',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  };
  return labels[status] || status;
};
```

---

## Quick Tips

1. **Always validate on frontend before API calls** - Saves round trips
2. **Upload images before creating job** - Get URLs to include in job data
3. **Use draft mode** - Let users save progress
4. **Cache categories** - They rarely change
5. **Handle 401 errors globally** - Auto-redirect to login
6. **Show loading states** - Better UX during uploads
7. **Validate file types before upload** - JPEG, PNG, WebP only
8. **Show image previews** - Before upload confirmation
9. **Use optimistic updates** - Update UI immediately, rollback on error
10. **Implement retry logic** - For failed image uploads
