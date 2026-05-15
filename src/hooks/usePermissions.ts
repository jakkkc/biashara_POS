import { useAuth } from './useAuth';

export function usePermissions() {
  const { profile, isAdmin } = useAuth();
  const role = profile?.role;

  if (isAdmin) {
    return {
      canViewAnalytics: true,
      canEditTransactions: true,
      canManageInventory: true,
      canManageStaff: true,
      canViewAuditLog: true,
      canInitiateTransfer: true,
      canApproveTransfer: true,
      canChangeSettings: true,
      canViewExpenses: true,
      canExportReports: true,
      isSuperAdmin: true,
    };
  }

  return {
    canViewAnalytics: role === 'owner' || role === 'manager',
    canEditTransactions: role === 'owner' || role === 'manager',
    canManageInventory: role === 'owner' || role === 'manager',
    canManageStaff: role === 'owner',
    canViewAuditLog: role === 'owner' || role === 'manager',
    canInitiateTransfer: role === 'owner' || role === 'manager' || role === 'sales_person',
    canApproveTransfer: role === 'owner' || role === 'manager',
    canChangeSettings: role === 'owner',
    canViewExpenses: role === 'owner' || role === 'manager',
    canExportReports: role === 'owner',
    isSuperAdmin: false,
  };
}
