import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Business } from '../types';
import { Shield, CheckCircle, AlertOctagon, TrendingUp, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'businesses'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBusinesses(snap.docs.map(doc => ({ ...doc.data() as Business, id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleBusinessStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'businesses', id), { status: newStatus });
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 -mx-8 -mt-8 p-8 mb-8 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Shield size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Environment</span>
            </div>
            <h1 className="text-3xl font-bold italic">Nex-Ink Operations Centre</h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Platform Status</p>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                   All Systems Operational
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Businesses</p>
            <h3 className="text-3xl font-black text-zinc-900">{businesses.length}</h3>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Accounts</p>
            <h3 className="text-3xl font-black text-emerald-600">{businesses.filter(b => b.status === 'active').length}</h3>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Suspended</p>
            <h3 className="text-3xl font-black text-red-600">{businesses.filter(b => b.status === 'suspended').length}</h3>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-zinc-900">Registered Businesses</h2>
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
             <Search size={16} className="text-zinc-400" />
             <input 
               placeholder="Search business or owner..."
               className="bg-transparent outline-none text-sm"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                 {businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.ownerEmail.toLowerCase().includes(search.toLowerCase())).map(biz => (
                   <tr key={biz.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="font-bold text-zinc-900">{biz.name}</p>
                         <p className="text-xs text-zinc-400 font-mono uppercase">{biz.id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{biz.category}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{biz.town}, {biz.county}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{biz.ownerEmail}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                           biz.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                         )}>
                           {biz.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button
                           onClick={() => toggleBusinessStatus(biz.id, biz.status)}
                           className={cn(
                             "text-xs font-bold underline px-2 py-1 rounded",
                             biz.status === 'active' ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                           )}
                         >
                           {biz.status === 'active' ? 'Suspend' : 'Activate'}
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
