import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserProfile, Business, UserRole } from '../types';

interface AuditParams {
  action: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId?: string;
  branchName?: string;
  details: any;
}

export async function logAction(params: AuditParams) {
  try {
    const deviceInfo = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server';
    
    const logData = {
      ...params,
      timestamp: serverTimestamp(),
      deviceInfo,
    };

    // Use a batch to ensure both writes succeed or fail together
    const batch = writeBatch(db);
    
    // 1. Branch-specific log (NEW)
    if (params.branchId) {
      const branchLogRef = doc(collection(db, `businesses/${params.businessId}/branches/${params.branchId}/auditLog`));
      batch.set(branchLogRef, logData);
    } else {
      // Fallback to business-level if no branchId (e.g. business-level global actions)
      const bizLogRef = doc(collection(db, `businesses/${params.businessId}/auditLog`));
      batch.set(bizLogRef, logData);
    }
    
    // 2. Global Ops log (Super Admin)
    const globalLogEntryRef = doc(collection(db, 'superAdmin/auditLog/entries'));
    batch.set(globalLogEntryRef, logData);
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
}

export function useAuditLogger() {
  // Helper to log with current context
  const log = async (action: string, details: any, profile: UserProfile, business: Business, branchName?: string) => {
    await logAction({
      action,
      details,
      businessId: business.id,
      businessName: business.name,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      branchId: profile.branchId,
      branchName: branchName || 'Main Office', // Default or fetch branch name
    });
  };

  return { log };
}
