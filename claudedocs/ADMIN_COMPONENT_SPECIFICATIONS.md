# Admin Portal Component Specifications

## Overview

This document provides detailed specifications for all major components in the Taska admin portal, including TypeScript interfaces, props, state management, and implementation guidelines.

## Shared Component Library

### 1. AdminDataTable Component

**Purpose**: Reusable data table with filtering, sorting, pagination, and actions

**File**: `components/admin/AdminDataTable.tsx`

```typescript
import { ColumnDef, useReactTable } from '@tanstack/react-table';

export interface AdminDataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDef<T>[];
  totalCount?: number;

  // Loading states
  loading?: boolean;
  error?: string | null;

  // Filtering
  filters?: FilterConfig[];
  defaultFilters?: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;

  // Pagination
  pagination?: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  };

  // Sorting
  sortable?: boolean;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };

  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;

  // Actions
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];

  // Interaction
  onRowClick?: (row: T) => void;

  // Customization
  emptyMessage?: string;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: any;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ComponentType;
  onClick: (row: T) => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'ghost';
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  loading?: boolean;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ComponentType;
  onClick: (rows: T[]) => void | Promise<void>;
  variant?: 'default' | 'destructive';
  confirmMessage?: string;
}

// Usage Example:
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span>{row.original.email}</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge>{row.original.role}</Badge>,
  },
  // ... more columns
];

<AdminDataTable
  data={users}
  columns={userColumns}
  totalCount={totalUsers}
  loading={isLoading}
  filters={[
    { key: 'role', label: 'Role', type: 'select', options: roleOptions },
    { key: 'status', label: 'Status', type: 'select', options: statusOptions },
    { key: 'search', label: 'Search', type: 'text', placeholder: 'Email or name...' },
  ]}
  pagination={{
    enabled: true,
    pageSize: 20,
    currentPage: page,
    onPageChange: setPage,
  }}
  rowActions={[
    {
      label: 'View',
      icon: Eye,
      onClick: (user) => navigate(`/admin/users/${user.id}`),
    },
    {
      label: 'Ban',
      icon: Ban,
      onClick: (user) => handleBan(user.id),
      variant: 'destructive',
      show: (user) => user.status === 'ACTIVE',
    },
  ]}
  selectable
  onSelectionChange={setSelectedUsers}
/>
```

### 2. AdminStatCard Component

**Purpose**: Display key metrics with trend indicators

**File**: `components/admin/AdminStatCard.tsx`

```typescript
import { LucideIcon } from 'lucide-react';

export interface AdminStatCardProps {
  // Content
  title: string;
  value: string | number;
  subtitle?: string;

  // Visual
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

  // Trend
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };

  // State
  loading?: boolean;

  // Interaction
  onClick?: () => void;
  href?: string;

  // Customization
  className?: string;
}

// Implementation:
export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  loading,
  onClick,
  href,
  className,
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const trendColor = trend?.direction === 'up' ? 'text-green-600' : 'text-red-600';

  const content = (
    <Card className={cn('p-6 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>

          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                {trend && (
                  <Badge variant="secondary" className={cn('text-xs', trendColor)}>
                    {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>

        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
};

// Usage:
<AdminStatCard
  title="Total Users"
  value={metrics.totalUsers}
  subtitle={`${metrics.activeUsers} active today`}
  icon={Users}
  color="blue"
  trend={{ value: 12.5, direction: 'up' }}
  href="/admin/users"
/>
```

### 3. ApprovalQueueCard Component

**Purpose**: Display items requiring approval with approve/reject actions

**File**: `components/admin/ApprovalQueueCard.tsx`

```typescript
export interface ApprovalQueueCardProps<T> {
  // Data
  item: T;

  // Rendering
  title: string | ((item: T) => string);
  description?: string | ((item: T) => React.ReactNode);
  metadata?: Array<{ label: string; value: string | ((item: T) => string) }>;
  preview?: (item: T) => React.ReactNode;

  // Actions
  onApprove: (item: T, notes?: string) => Promise<void>;
  onReject: (item: T, reason: string) => Promise<void>;
  onView?: (item: T) => void;

  // Config
  requireNotes?: boolean;
  requireRejectReason?: boolean;
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType;
    onClick: (item: T) => void | Promise<void>;
    variant?: 'default' | 'destructive';
  }>;

  // State
  loading?: boolean;

  // Customization
  className?: string;
}

// Usage:
<ApprovalQueueCard
  item={payment}
  title={(payment) => `Payment #${payment.id.slice(0, 8)}`}
  description={(payment) => (
    <div>
      <p>Amount: {formatCurrency(payment.amount)}</p>
      <p>From: {payment.payer.name}</p>
      <p>To: {payment.payee.name}</p>
    </div>
  )}
  metadata={[
    { label: 'Date', value: (p) => formatDate(p.createdAt) },
    { label: 'Method', value: (p) => p.paymentMethod },
    { label: 'Status', value: (p) => p.status },
  ]}
  onApprove={handleApprovePayment}
  onReject={handleRejectPayment}
  requireRejectReason
/>
```

### 4. SettingsPanel Component

**Purpose**: Consistent layout for settings sections

**File**: `components/admin/SettingsPanel.tsx`

```typescript
export interface SettingsPanelProps {
  // Header
  title: string;
  description?: string;
  icon?: LucideIcon;

  // Content
  children: React.ReactNode;

  // Footer
  actions?: React.ReactNode;
  saveButton?: {
    label?: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
  };

  // State
  loading?: boolean;
  error?: string | null;

  // Layout
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Customization
  className?: string;
}

// Implementation:
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  title,
  description,
  icon: Icon,
  children,
  actions,
  saveButton,
  loading,
  error,
  width = 'lg',
  className,
}) => {
  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <Card className={cn('p-6', widthClasses[width], className)}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <div className="space-y-6">{children}</div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Footer */}
      {(actions || saveButton) && (
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex items-center justify-end gap-3">
            {actions}
            {saveButton && (
              <Button
                onClick={saveButton.onClick}
                disabled={saveButton.disabled || saveButton.loading}
                loading={saveButton.loading}
              >
                {saveButton.label || 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Usage:
<SettingsPanel
  title="Currency Configuration"
  description="Manage supported currencies and exchange rates"
  icon={DollarSign}
  width="lg"
  saveButton={{
    onClick: handleSave,
    loading: isSaving,
  }}
>
  <CurrencyForm />
</SettingsPanel>
```

### 5. AuditLogViewer Component

**Purpose**: Display activity logs with filtering and details

**File**: `components/admin/AuditLogViewer.tsx`

```typescript
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogViewerProps {
  // Data source
  entityType?: string;
  entityId?: string;
  userId?: string;

  // Display
  limit?: number;
  showFilters?: boolean;

  // Interaction
  onEntryClick?: (entry: AuditLogEntry) => void;

  // Customization
  className?: string;
}

// Implementation features:
- Filter by user, action type, date range
- Show before/after diff for changes
- IP address and user agent display
- Export to CSV functionality
- Real-time updates via polling or websocket

// Usage:
<AuditLogViewer
  entityType="USER"
  entityId={selectedUser.id}
  limit={50}
  showFilters
  onEntryClick={(entry) => setSelectedEntry(entry)}
/>
```

## Page-Specific Components

### Currency Management

**File**: `components/admin/settings/CurrencyManager.tsx`

```typescript
export interface Currency {
  code: string;          // ISO 4217 (e.g., "ZAR", "USD")
  symbol: string;        // e.g., "R", "$"
  name: string;          // e.g., "South African Rand"
  exchangeRate: number;  // Rate relative to base currency
  decimals: number;      // Decimal places (usually 2)
  isDefault: boolean;    // Default platform currency
  isActive: boolean;     // Available for transactions
  updatedAt: string;     // Last exchange rate update
}

export interface CurrencyManagerProps {
  onSave?: () => void;
}

// Features:
export const CurrencyManager: React.FC<CurrencyManagerProps> = ({ onSave }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [exchangeRateSource, setExchangeRateSource] = useState<'manual' | 'api'>('manual');

  return (
    <div className="space-y-6">
      {/* Currency List */}
      <AdminDataTable
        data={currencies}
        columns={currencyColumns}
        rowActions={[
          { label: 'Edit', icon: Edit, onClick: handleEdit },
          { label: 'Toggle Active', icon: Power, onClick: handleToggleActive },
          {
            label: 'Set Default',
            icon: Star,
            onClick: handleSetDefault,
            show: (currency) => !currency.isDefault,
          },
        ]}
      />

      {/* Add Currency Button */}
      <Button onClick={() => setEditingCurrency({} as Currency)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Currency
      </Button>

      {/* Currency Form Modal */}
      <Dialog open={!!editingCurrency} onOpenChange={() => setEditingCurrency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCurrency?.code ? 'Edit Currency' : 'Add Currency'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FormField name="code" label="Currency Code" required />
            <FormField name="symbol" label="Symbol" required />
            <FormField name="name" label="Name" required />

            <div className="space-y-2">
              <label>Exchange Rate Source</label>
              <RadioGroup value={exchangeRateSource} onValueChange={setExchangeRateSource}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Manual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="api" id="api" />
                  <Label htmlFor="api">Auto-update (API)</Label>
                </div>
              </RadioGroup>
            </div>

            {exchangeRateSource === 'manual' && (
              <FormField
                name="exchangeRate"
                label="Exchange Rate"
                type="number"
                step="0.0001"
                required
              />
            )}

            <SwitchField name="isActive" label="Active" />
            <SwitchField name="isDefault" label="Set as Default" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCurrency(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exchange Rate Update History */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Recent Exchange Rate Updates</h3>
        <AuditLogViewer
          entityType="CURRENCY"
          limit={10}
        />
      </Card>
    </div>
  );
};
```

### Map API Configuration

**File**: `components/admin/settings/MapAPIConfig.tsx`

```typescript
export interface MapAPIConfig {
  provider: 'GOOGLE_MAPS' | 'MAPBOX' | 'OPENSTREETMAP';
  apiKey: string;
  restrictDomains: string[];
  enabledFeatures: {
    geocoding: boolean;
    directions: boolean;
    places: boolean;
    staticMaps: boolean;
  };
  rateLimit: {
    requestsPerDay: number;
    currentUsage: number;
  };
  testResults?: {
    geocoding: 'success' | 'error' | 'pending';
    directions: 'success' | 'error' | 'pending';
    message?: string;
  };
}

export const MapAPIConfig: React.FC = () => {
  const [config, setConfig] = useState<MapAPIConfig | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await adminApi.testMapConnection();
      setConfig(prev => prev ? { ...prev, testResults: result } : null);
      toast.success('Connection test successful');
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SettingsPanel
      title="Map API Configuration"
      description="Configure map services for location features"
      icon={Map}
      saveButton={{
        onClick: handleSave,
        loading: isSaving,
      }}
    >
      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Map Provider</label>
          <Select value={config?.provider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GOOGLE_MAPS">Google Maps</SelectItem>
              <SelectItem value="MAPBOX">Mapbox</SelectItem>
              <SelectItem value="OPENSTREETMAP">OpenStreetMap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <div className="flex gap-2">
            <Input
              type="password"
              value={config?.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder="Enter API key"
            />
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config?.apiKey}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
          {config?.testResults && (
            <Alert className="mt-2" variant={config.testResults.geocoding === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>
                {config.testResults.message || 'Connection tested successfully'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Domain Restrictions */}
        <div>
          <label className="block text-sm font-medium mb-2">Allowed Domains</label>
          <TagInput
            value={config?.restrictDomains || []}
            onChange={(domains) => handleConfigChange('restrictDomains', domains)}
            placeholder="Add domain (e.g., taska.co.za)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Restrict API key usage to specific domains for security
          </p>
        </div>

        {/* Enabled Features */}
        <div>
          <label className="block text-sm font-medium mb-3">Enabled Features</label>
          <div className="space-y-2">
            <SwitchField
              checked={config?.enabledFeatures.geocoding}
              onChange={(checked) => handleFeatureToggle('geocoding', checked)}
              label="Geocoding (Address → Coordinates)"
            />
            <SwitchField
              checked={config?.enabledFeatures.directions}
              onChange={(checked) => handleFeatureToggle('directions', checked)}
              label="Directions & Routing"
            />
            <SwitchField
              checked={config?.enabledFeatures.places}
              onChange={(checked) => handleFeatureToggle('places', checked)}
              label="Places & Search"
            />
            <SwitchField
              checked={config?.enabledFeatures.staticMaps}
              onChange={(checked) => handleFeatureToggle('staticMaps', checked)}
              label="Static Maps"
            />
          </div>
        </div>

        {/* Usage Statistics */}
        <Card className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">API Usage</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Requests Today</span>
            <span className="text-sm font-semibold">
              {config?.rateLimit.currentUsage.toLocaleString()} / {config?.rateLimit.requestsPerDay.toLocaleString()}
            </span>
          </div>
          <Progress
            value={(config?.rateLimit.currentUsage || 0) / (config?.rateLimit.requestsPerDay || 1) * 100}
            className="mt-2"
          />
        </Card>
      </div>
    </SettingsPanel>
  );
};
```

### Escrow Configuration

**File**: `components/admin/settings/EscrowConfig.tsx`

```typescript
export interface EscrowConfig {
  holdDuration: number;          // Days to hold payment in escrow
  autoRelease: boolean;          // Auto-release after hold duration
  disputeWindow: number;         // Days to file dispute after release
  minimumAmount: number;         // Minimum escrow amount (ZAR)
  maximumAmount: number;         // Maximum escrow amount (ZAR)
  platformFeePercentage: number; // Platform fee (0-30%)
  refundPolicy: {
    clientCancellation: number;  // % refund if client cancels
    artisanNoShow: number;       // % refund if artisan no-show
    disputeResolution: number;   // % refund on dispute
  };
}

export const EscrowConfig: React.FC = () => {
  const { data: config, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'escrow'],
    queryFn: adminApi.getEscrowConfig,
  });

  const updateMutation = useMutation({
    mutationFn: adminApi.updateEscrowConfig,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'settings', 'escrow']);
      toast.success('Escrow settings updated');
    },
  });

  return (
    <SettingsPanel
      title="Escrow Configuration"
      description="Manage payment holding and release policies"
      icon={Shield}
      loading={isLoading}
      saveButton={{
        onClick: () => updateMutation.mutate(formData),
        loading: updateMutation.isLoading,
      }}
    >
      <div className="space-y-6">
        {/* Hold Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Escrow Hold Duration
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="30"
              value={config?.holdDuration}
              onChange={(e) => handleChange('holdDuration', parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">days</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            How long to hold payment before release (1-30 days)
          </p>
        </div>

        {/* Auto-Release */}
        <SwitchField
          checked={config?.autoRelease}
          onChange={(checked) => handleChange('autoRelease', checked)}
          label="Auto-release payment after hold duration"
          description="Automatically release funds if no disputes are filed"
        />

        {/* Dispute Window */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Dispute Filing Window
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="14"
              value={config?.disputeWindow}
              onChange={(e) => handleChange('disputeWindow', parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">days after release</span>
          </div>
        </div>

        {/* Amount Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={config?.minimumAmount}
              onChange={(e) => handleChange('minimumAmount', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Maximum Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={config?.maximumAmount}
              onChange={(e) => handleChange('maximumAmount', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Platform Fee */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Platform Fee
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={config?.platformFeePercentage}
              onChange={(e) => handleChange('platformFeePercentage', parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Percentage charged on each transaction (0-30%)
          </p>
        </div>

        {/* Refund Policies */}
        <div>
          <h4 className="text-sm font-medium mb-3">Refund Policies</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700">Client Cancellation</label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config?.refundPolicy.clientCancellation}
                  onChange={(e) => handleRefundPolicyChange('clientCancellation', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">% refund</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Artisan No-Show</label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config?.refundPolicy.artisanNoShow}
                  onChange={(e) => handleRefundPolicyChange('artisanNoShow', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">% refund</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Dispute Resolution</label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config?.refundPolicy.disputeResolution}
                  onChange={(e) => handleRefundPolicyChange('disputeResolution', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">% refund (admin discretion)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Changes to escrow settings will only apply to new transactions.
            Existing escrow holds will follow their original terms.
          </AlertDescription>
        </Alert>
      </div>
    </SettingsPanel>
  );
};
```

### Payment Approval Queue

**File**: `components/admin/payments/PaymentApprovalQueue.tsx`

```typescript
export interface PendingPayment {
  id: string;
  jobId: string;
  jobTitle: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  payee: {
    id: string;
    name: string;
    email: string;
  };
  paymentMethod: string;
  provider: string;
  providerTxnId: string;
  status: 'PENDING' | 'PROCESSING';
  escrowStatus: 'HELD';
  createdAt: string;
  metadata?: Record<string, any>;
}

export const PaymentApprovalQueue: React.FC = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin', 'payments', 'pending'],
    queryFn: adminApi.getPendingPayments,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approvePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'payments']);
      toast.success('Payment approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'payments']);
      toast.success('Payment rejected');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Approval Queue</h1>
          <p className="text-gray-600">
            {payments?.length || 0} payments awaiting approval
          </p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin', 'payments'])}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <PaymentCardSkeleton key={i} />)}
        </div>
      ) : payments?.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
          <p className="text-gray-600">No payments pending approval</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments?.map(payment => (
            <ApprovalQueueCard
              key={payment.id}
              item={payment}
              title={`Payment for: ${payment.jobTitle}`}
              description={(payment) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Platform Fee:</span>
                    <span>{formatCurrency(payment.platformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="font-bold">{formatCurrency(payment.totalAmount)}</span>
                  </div>
                </div>
              )}
              metadata={[
                {
                  label: 'From',
                  value: (p) => `${p.payer.name} (${p.payer.email})`
                },
                {
                  label: 'To',
                  value: (p) => `${p.payee.name} (${p.payee.email})`
                },
                {
                  label: 'Method',
                  value: (p) => p.paymentMethod
                },
                {
                  label: 'Provider',
                  value: (p) => `${p.provider} (${p.providerTxnId})`
                },
                {
                  label: 'Date',
                  value: (p) => formatDate(p.createdAt)
                },
              ]}
              onApprove={(payment) => approveMutation.mutateAsync(payment.id)}
              onReject={(payment, reason) =>
                rejectMutation.mutateAsync({ id: payment.id, reason })
              }
              requireRejectReason
              customActions={[
                {
                  label: 'View Job',
                  icon: ExternalLink,
                  onClick: (payment) => window.open(`/admin/jobs/${payment.jobId}`, '_blank'),
                },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Review Moderation

**File**: `components/admin/reviews/ReviewModeration.tsx`

```typescript
export interface ModerationReview {
  id: string;
  jobId: string;
  jobTitle: string;
  rating: number;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  valueRating: number;
  comment: string;
  images: string[];
  reviewer: {
    id: string;
    name: string;
    role: 'CLIENT' | 'ARTISAN';
  };
  reviewee: {
    id: string;
    name: string;
    role: 'CLIENT' | 'ARTISAN';
  };
  flagged: boolean;
  flagReason?: string;
  isVerified: boolean;
  createdAt: string;
}

export const ReviewModeration: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'unverified'>('flagged');
  const [selectedReview, setSelectedReview] = useState<ModerationReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', filter],
    queryFn: () => adminApi.getReviews({ flagged: filter === 'flagged' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModerationReview> }) =>
      adminApi.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'reviews']);
      toast.success('Review updated');
      setIsEditing(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'reviews']);
      toast.success('Review approved');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="unverified">Unverified</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Review List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reviews?.map(review => (
          <Card key={review.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedReview(review)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium">{review.jobTitle}</h3>
                <p className="text-sm text-gray-600">
                  {review.reviewer.name} → {review.reviewee.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={review.flagged ? 'destructive' : 'secondary'}>
                  {review.flagged ? 'Flagged' : 'Normal'}
                </Badge>
                {!review.isVerified && (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  )}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {review.rating.toFixed(1)}
              </span>
            </div>

            <p className="text-sm text-gray-700 line-clamp-2">
              {review.comment}
            </p>

            {review.flagged && review.flagReason && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {review.flagReason}
                </AlertDescription>
              </Alert>
            )}
          </Card>
        ))}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                {selectedReview.jobTitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Ratings Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RatingItem label="Quality" value={selectedReview.qualityRating} />
                <RatingItem label="Timeliness" value={selectedReview.timelinessRating} />
                <RatingItem label="Communication" value={selectedReview.communicationRating} />
                <RatingItem label="Value" value={selectedReview.valueRating} />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                {isEditing ? (
                  <Textarea
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedReview.comment}
                  </p>
                )}
              </div>

              {/* Images */}
              {selectedReview.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Photos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReview.images.map((url, i) => (
                      <Image
                        key={i}
                        src={url}
                        alt={`Review image ${i + 1}`}
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Reviewer:</span> {selectedReview.reviewer.name} ({selectedReview.reviewer.role})
                </div>
                <div>
                  <span className="font-medium">Reviewee:</span> {selectedReview.reviewee.name} ({selectedReview.reviewee.role})
                </div>
                <div>
                  <span className="font-medium">Date:</span> {formatDate(selectedReview.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedReview.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Comment'}
              </Button>

              {!selectedReview.isVerified && (
                <Button
                  onClick={() => approveMutation.mutate(selectedReview.id)}
                  loading={approveMutation.isLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & Approve
                </Button>
              )}

              {isEditing && (
                <Button
                  onClick={() => updateMutation.mutate({
                    id: selectedReview.id,
                    data: { comment: editedComment },
                  })}
                  loading={updateMutation.isLoading}
                >
                  Save Changes
                </Button>
              )}

              <Button
                variant="destructive"
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    rejectMutation.mutate({ id: selectedReview.id, reason });
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const RatingItem = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="flex items-center gap-1">
      <Star className={cn('w-4 h-4', value >= 1 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')} />
      <span className="text-sm font-medium">{value.toFixed(1)}</span>
    </div>
  </div>
);
```

## Utility Components

### DateRangePicker Component

```typescript
// components/admin/DateRangePicker.tsx
export interface DateRangePickerProps {
  value: { from: Date | null; to: Date | null };
  onChange: (range: { from: Date | null; to: Date | null }) => void;
  placeholder?: string;
  className?: string;
}
```

### ExportButton Component

```typescript
// components/admin/ExportButton.tsx
export interface ExportButtonProps {
  data: any[];
  filename: string;
  format: 'csv' | 'json' | 'pdf';
  columns?: string[];
  loading?: boolean;
}
```

### BulkActionBar Component

```typescript
// components/admin/BulkActionBar.tsx
export interface BulkActionBarProps<T> {
  selectedItems: T[];
  actions: BulkAction<T>[];
  onClearSelection: () => void;
}
```

## Next Steps

1. Implement base component library (AdminDataTable, AdminStatCard, etc.)
2. Create page layouts using these components
3. Integrate with backend API
4. Add comprehensive testing
5. Accessibility audit
6. Performance optimization

This specification provides the foundation for building a consistent, maintainable admin portal with reusable components and clear contracts.
