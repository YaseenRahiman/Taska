# Admin Portal - Quick Start Guide

## 🚀 Getting Started

### Access the Admin Portal

1. **Navigate to Login**:
   ```
   URL: http://localhost:3000/auth/login
   ```

2. **Admin Credentials**:
   ```
   Email: admin@taska.com
   Password: Admin@123456
   ```

3. **After Login**:
   - Automatically redirected to `/admin/dashboard`
   - Sidebar navigation visible on left
   - Top header with search and notifications

---

## 📋 Quick Reference

### Navigation Structure

```
Admin Portal
├── Dashboard (/admin/dashboard)
│   ├── Platform Metrics
│   ├── System Health
│   ├── Recent Activity
│   └── Quick Actions
│
├── User Management (/admin/users)
│   ├── User List with Filters
│   ├── User Details
│   ├── Ban/Suspend Users
│   └── Verify Artisans
│
├── Financial (/admin/financial)
│   ├── Overview Tab
│   ├── Transactions Tab
│   └── Reconciliation Tab
│
├── Moderation (/admin/moderation)
│   ├── Reported Content Tab
│   └── Disputes Tab
│
└── Settings (/admin/settings)
    ├── General Settings
    ├── Email Templates
    ├── Feature Flags
    └── Announcements
```

---

## 🎯 Common Tasks

### 1. View Platform Overview
**Route**: `/admin/dashboard`
- Check total users, jobs, revenue
- Monitor system health
- View recent activity
- Access quick actions

### 2. Manage a User
**Route**: `/admin/users`
1. Use filters to find user
2. Click eye icon to view details
3. Take action:
   - Ban: Click ban icon, enter reason
   - Suspend: Click clock icon, set duration
   - Verify: Click checkmark (artisans only)
   - Reset Password: Click shield icon

### 3. Review Finances
**Route**: `/admin/financial`
1. **Overview Tab**: View high-level metrics
2. **Transactions Tab**: See detailed transactions
3. **Reconciliation Tab**: Check balance reconciliation
4. Use date range filter for specific periods
5. Click Export for reports

### 4. Moderate Content
**Route**: `/admin/moderation`
1. **Reported Content**:
   - Click Filters to narrow results
   - Click eye icon to view full content
   - Click checkmark to approve
   - Click X to reject (enter reason)

2. **Disputes**:
   - Review dispute details
   - Click Resolve
   - Enter resolution notes
   - Specify refund amount if needed

### 5. Configure Settings
**Route**: `/admin/settings`
1. **General Settings**: Platform fees, security
2. **Email Templates**: Customize emails
3. **Feature Flags**: Toggle features on/off
4. **Announcements**: Create system messages

---

## 🔑 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | `Ctrl/Cmd + K` (planned) |
| Refresh Page | `F5` or `Ctrl/Cmd + R` |
| Open Notifications | Click bell icon |
| Toggle Sidebar (mobile) | Click menu icon |

---

## 📊 Key Metrics Explained

### Dashboard Metrics

- **Total Users**: All registered users (Client + Artisan + Admin)
- **Active Users**: Users active today
- **User Growth**: Percentage change from previous period
- **Total Jobs**: All jobs posted on platform
- **Active Jobs**: Currently open jobs
- **Job Growth**: Percentage change from previous period
- **Monthly Revenue**: Revenue for current month
- **Today's Revenue**: Revenue earned today
- **Conversion Rate**: Percentage of jobs that receive bids

### Financial Metrics

- **Total Revenue**: All-time revenue
- **Platform Fees**: Commission collected (15% default)
- **Total Payouts**: Money paid to artisans
- **Escrow Balance**: Funds held in escrow
- **Pending Payouts**: Payments awaiting processing

---

## 🛡️ Security Features

### Role-Based Access
- Only ADMIN role can access admin portal
- Non-admin users automatically redirected
- All API endpoints protected with guards

### Session Management
- Auto-logout after inactivity
- Token refresh on activity
- Secure cookie storage

### Audit Trail
- All admin actions logged
- User action history tracked
- System events recorded

---

## ⚡ Performance Tips

1. **Use Filters**: Narrow results before loading
2. **Date Ranges**: Limit data retrieval periods
3. **Pagination**: Navigate through large datasets
4. **Auto-Refresh**: Dashboard updates every 30s
5. **Export Data**: For offline analysis

---

## 🐛 Troubleshooting

### Cannot Access Admin Portal
- **Check**: Are you logged in as admin?
- **Verify**: Email is `admin@taska.com`
- **Clear**: Browser cache and cookies
- **Retry**: Logout and login again

### Data Not Loading
- **Check**: Internet connection
- **Verify**: Backend server is running
- **Refresh**: Click refresh button
- **Wait**: Initial load may take 2-3 seconds

### Action Failed
- **Check**: Error message in alert
- **Verify**: You have permission
- **Retry**: Wait a moment and try again
- **Report**: If issue persists, contact support

---

## 📱 Mobile Usage

### Responsive Design
- **Desktop**: Full sidebar visible
- **Tablet**: Collapsible sidebar
- **Mobile**: Drawer navigation

### Mobile Navigation
1. Tap menu icon (☰) in top-left
2. Sidebar slides in from left
3. Tap menu item to navigate
4. Tap outside sidebar to close

---

## 🎨 UI Elements Guide

### Icons Meaning

| Icon | Meaning |
|------|---------|
| 👁️ | View details |
| ✓ | Approve/Verify |
| ✗ | Reject/Deny |
| 🕒 | Suspend |
| 🚫 | Ban |
| 🔄 | Refresh |
| ⬇️ | Download/Export |
| 🔍 | Search |
| 🔔 | Notifications |
| ⚙️ | Settings |

### Status Colors

| Color | Status |
|-------|--------|
| 🟢 Green | Active/Approved/Completed |
| 🟡 Yellow | Pending/Warning |
| 🔴 Red | Banned/Rejected/Error |
| ⚪ Gray | Inactive/Disabled |
| 🔵 Blue | Information/Processing |

---

## 📖 Additional Resources

### Documentation
- [Complete Documentation](./ADMIN_PORTAL_SPRINT_1_COMPLETE.md)
- [API Documentation](http://localhost:3001/api/docs)
- [Backend Repository](../backend/README.md)

### Testing
- [E2E Test Suite](../tests/e2e/admin-portal.spec.ts)
- Run tests: `npx playwright test tests/e2e/admin-portal.spec.ts`

### Support
- **Help Center**: Click Help Center in footer
- **Documentation**: Click Documentation in footer
- **System Status**: Click System Status in footer

---

## 🔄 Updates & Maintenance

### Regular Tasks
- **Daily**: Check system health, review pending moderation
- **Weekly**: Review financial reconciliation, export reports
- **Monthly**: Analyze user growth, adjust platform fees if needed

### System Updates
- Backend updates: Automatic (check System Status)
- Frontend updates: Automatic page reload when available
- Database migrations: Coordinated with backend team

---

## ⚠️ Important Notes

1. **Backup Before Changes**: Major settings changes should be documented
2. **Two-Person Rule**: Critical actions (bans) should be reviewed
3. **Audit Compliance**: All actions are logged and auditable
4. **Performance Impact**: Bulk operations may affect system performance
5. **User Privacy**: Handle user data according to privacy policy

---

## 🎓 Best Practices

### User Management
- ✅ Always provide reason for bans/suspensions
- ✅ Verify artisan credentials thoroughly
- ✅ Use temporary suspensions before permanent bans
- ✅ Document actions in user notes

### Financial Management
- ✅ Reconcile daily
- ✅ Export weekly reports
- ✅ Monitor escrow balance
- ✅ Track payment gateway status

### Content Moderation
- ✅ Review reported content promptly
- ✅ Provide detailed rejection reasons
- ✅ Resolve disputes fairly
- ✅ Document moderation decisions

### System Settings
- ✅ Test changes in staging first
- ✅ Document setting modifications
- ✅ Monitor impact after changes
- ✅ Keep backups of configurations

---

## 📞 Getting Help

### Quick Help
1. Hover over any field for tooltip
2. Check error messages in alerts
3. Review console for technical errors

### Contact Support
- **Technical Issues**: tech@taska.com
- **User Reports**: support@taska.com
- **Emergency**: emergency@taska.com (24/7)

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
**Author**: Taska Platform Team
