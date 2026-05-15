import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLogEntry } from '../types';
import { Search, Filter, Download, History, User, Building2, Smartphone, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLog() {
  const { business, profile, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (!isAdmin && !business?.id) return;

    let q;
    if (isAdmin) {
      // Global logs for Super Admin
      q = query(
        collection(db, 'superAdmin/auditLog/entries'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
    } else {
      // Branch-scoped for managers, business-scoped for owners
      const path = `businesses/${business!.id}/auditLog`;
      if (profile?.role === 'manager') {
         q = query(
           collection(db, path),
           where('branchId', '==', profile.branchId),
           orderBy('timestamp', 'desc'),
           limit(300)
         );
      } else {
        q = query(
          collection(db, path),
          orderBy('timestamp', 'desc'),
          limit(300)
        );
      }
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ ...doc.data() as AuditLogEntry, id: doc.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [business?.id, isAdmin, profile?.role, profile?.branchId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.businessName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter ? log.userRole === roleFilter : true;
    const matchesAction = actionFilter ? log.action === actionFilter : true;

    return matchesSearch && matchesRole && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (action.includes('DELETED') || action.includes('VOIDED')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (action.includes('SUSPENDED')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const actions = Array.from(new Set(logs.map(l => l.action))).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Audit Trail</h1>
          <p className="text-slate-500 text-sm">
            {isAdmin ? 'Global operations activity log.' : `Historical verification for ${business?.name}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
             <Download size={16} />
             Export Excel
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
             <Download size={16} />
             Export PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search user, business, or action..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none transition-all shadow-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="sales_person">Sales Person</option>
            </select>
         </div>
         <div className="relative">
            <History className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none transition-all shadow-sm"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
         </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition-all group">
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-widest ${getActionColor(log.action)}`}>
                    {log.action.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {log.timestamp ? format(log.timestamp.toDate(), 'PP p') : 'Processing...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {log.userName} <span className="font-normal text-slate-500">({log.userRole})</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAdmin && log.businessName ? `${log.businessName} • ` : ''}
                      {log.branchName || 'Main branch'}
                    </p>
                  </div>
                </div>

                <div className="ml-14 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2 text-xs text-slate-700">
                      <ArrowRight size={14} className="text-slate-400" />
                      <pre className="whitespace-pre-wrap font-sans">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                   </div>
                </div>
              </div>

              <div className="hidden md:block w-px h-16 bg-slate-100" />

              <div className="md:w-64 space-y-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Smartphone size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate" title={log.deviceInfo}>
                    {log.deviceInfo?.split(') ')[0]?.split(' (')[1] || 'Web Agent'}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ID: {log.businessId.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <History size={32} />
             </div>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No activity matches this vector</p>
          </div>
        )}
      </div>
    </div>
  );
}
