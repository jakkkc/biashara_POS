import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Business } from '../types';
import { Shield, Plus, CheckCircle, AlertOctagon, TrendingUp, Search, X, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { BUSINESS_CATEGORIES, COUNTIES } from '../constants';

export default function GlobalOps() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBiz, setNewBiz] = useState({
    name: '',
    category: '',
    county: '',
    town: '',
    phone: '',
    ownerEmail: '',
  });

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

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bizRef = await addDoc(collection(db, 'businesses'), {
        ...newBiz,
        status: 'active',
        settings: {
          currency: 'KES',
          vatEnabled: false,
          vatRate: 16,
          language: 'en',
          themeColor: '#3b82f6',
        },
        createdAt: new Date().toISOString(),
      });

      // Create Default Branch
      await addDoc(collection(db, `businesses/${bizRef.id}/branches`), {
        name: 'Main Branch',
        location: newBiz.town,
        phone: newBiz.phone,
        businessId: bizRef.id,
        createdAt: new Date().toISOString(),
      });

      setShowAddModal(false);
      setNewBiz({ name: '', category: '', county: '', town: '', phone: '', ownerEmail: '' });
    } catch (err) {
      console.error(err);
      alert('Error creating business');
    }
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
          <div className="flex items-center gap-4">
             <button
               onClick={() => setShowAddModal(true)}
               className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
             >
               <Plus size={18} />
               Register Business
             </button>
             <div className="border-l border-zinc-700 h-10 mx-2" />
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

      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-zinc-200">
             <div className="p-8 border-b border-zinc-100 bg-slate-900 text-white flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-xl tracking-tight">Enterprise Expansion</h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">Manual Business Registration</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full">
                 <X size={24} />
               </button>
             </div>
             <form onSubmit={handleAddBusiness} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Business Designation</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Enterprise Name"
                      value={newBiz.name}
                      onChange={e => setNewBiz({...newBiz, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Category</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newBiz.category}
                      onChange={e => setNewBiz({...newBiz, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Owner Email (Primary ID)</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="merchant@example.com"
                      value={newBiz.ownerEmail}
                      onChange={e => setNewBiz({...newBiz, ownerEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">County</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newBiz.county}
                      onChange={e => setNewBiz({...newBiz, county: e.target.value})}
                    >
                      <option value="">Select County</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Town</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="City/Town"
                      value={newBiz.town}
                      onChange={e => setNewBiz({...newBiz, town: e.target.value})}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl shadow-zinc-200 active:scale-95"
                >
                  Confirm Global Registration
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
