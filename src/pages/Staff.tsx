import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, setDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { UserPlus, Users, Shield, MapPin, Mail, Phone, MoreVertical, Ban, Trash2, CheckCircle, Search, Building2 } from 'lucide-react';
import { useAuditLogger } from '../lib/audit';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Staff() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales_person' as UserRole,
    branchId: '',
  });

  useEffect(() => {
    if (!business?.id || !profile) return;

    let q;
    if (profile.role === 'owner') {
      q = query(collectionGroup(db, 'staff'), where('businessId', '==', business.id));
    } else if (profile.branchId) {
      q = query(collection(db, `businesses/${business.id}/branches/${profile.branchId}/staff`));
    } else {
      return;
    }

    const unsubscribeStaff = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
    });

    // Fetch branches for assignment
    const bq = query(collection(db, `businesses/${business.id}/branches`));
    const unsubscribeBranches = onSnapshot(bq, (snap) => {
      setBranches(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/branches`);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeBranches();
    };
  }, [business?.id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !profile) return;

    try {
      // In a real app, we'd use a Cloud Function. 
      // Here we create the staff record in the branch subcollection
      const staffRef = doc(collection(db, `businesses/${business.id}/branches/${newStaff.branchId}/staff`));
      const staffData = {
        ...newStaff,
        businessId: business.id,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(staffRef, staffData);
      
      // Also update/create the global user profile (simulated)
      // Note: Real uid would be from auth creation
      await setDoc(doc(db, 'users', staffRef.id), staffData);
      
      await log('STAFF_CREATED', { 
        targetUserId: staffRef.id, 
        targetRole: newStaff.role, 
        targetEmail: newStaff.email,
        branchId: newStaff.branchId
      }, profile, business);

      setShowAddModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'sales_person', branchId: '' });
      alert('Staff member added successfully. (Simulation: Email sent)');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const toggleStatus = async (member: any) => {
    if (!business || !profile || !member.branchId) return;
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, `businesses/${business.id}/branches/${member.branchId}/staff`, member.id), { status: newStatus });
      await updateDoc(doc(db, 'users', member.id), { status: newStatus });
      await log(newStatus === 'suspended' ? 'STAFF_SUSPENDED' : 'STAFF_ACTIVATED', { 
        targetUserId: member.id, 
        targetName: member.name,
        branchId: member.branchId
      }, profile, business);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStaff = async (member: any) => {
    if (!business || !profile || !member.branchId) return;
    if (!window.confirm(`Are you sure you want to delete ${member.name}?`)) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/branches/${member.branchId}/staff`, member.id));
      await deleteDoc(doc(db, 'users', member.id));
      await log('STAFF_DELETED', { 
        targetUserId: member.id, 
        targetName: member.name,
        branchId: member.branchId
      }, profile, business);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBranchName = (branchId?: string) => {
    return branches.find(b => b.id === branchId)?.name || 'Main Office';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 text-sm">Organize your team and assign roles across branches.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 self-start md:self-auto"
        >
          <UserPlus size={18} />
          Add Team Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Users size={12} />
            {staff.length} Total Staff
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Member</th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role & Security</th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Branch</th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <Shield size={14} className={member.role === 'owner' ? 'text-amber-500' : 'text-slate-400'} />
                       <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{member.role.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                       <Building2 size={14} />
                       {getBranchName(member.branchId)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                      member.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {member.status}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                         onClick={() => toggleStatus(member)}
                         className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                         title={member.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                      >
                        <Ban size={18} />
                      </button>
                      {member.role !== 'owner' && (
                        <button 
                          onClick={() => deleteStaff(member)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStaff.length === 0 && !loading && (
            <div className="py-20 text-center">
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No matching personnel detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
             <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-sm tracking-tight">Expand Personnel</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Staff Vector Initialization</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                 <MoreVertical size={18} />
               </button>
             </div>
             <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Identity (Name)</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="e.g. Jane Doe"
                      value={newStaff.name}
                      onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Digital ID (Email)</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="jane@example.com"
                      value={newStaff.email}
                      onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Link</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="07XX XXX XXX"
                      value={newStaff.phone}
                      onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Security Role</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newStaff.role}
                      onChange={e => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                    >
                      <option value="manager">Manager</option>
                      <option value="sales_person">Sales Person</option>
                      <option value="inventory">Inventory Clerk</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operational Branch</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newStaff.branchId}
                      onChange={e => setNewStaff({...newStaff, branchId: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Authorize Team Member
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
