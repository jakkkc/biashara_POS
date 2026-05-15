import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Branch } from '../types';
import { Plus, MapPin, Phone, Building2, ChevronRight, X } from 'lucide-react';

export default function Branches() {
  const { business } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    phone: '',
  });

  useEffect(() => {
    if (!business?.id) return;

    const q = query(
      collection(db, `businesses/${business.id}/branches`)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setBranches(snap.docs.map(doc => ({ ...doc.data() as Branch, id: doc.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [business?.id]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    try {
      await addDoc(collection(db, `businesses/${business.id}/branches`), {
        ...newBranch,
        businessId: business.id,
        createdAt: new Date().toISOString(),
      });
      setShowAddModal(false);
      setNewBranch({ name: '', location: '', phone: '' });
    } catch (err) {
      console.error(err);
      alert('Error adding branch');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Outlets</h1>
          <p className="text-slate-500 text-sm">Manage your different branches and distribution points.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 self-start md:self-auto"
        >
          <Plus size={18} />
          Append New Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                <Building2 size={24} />
              </div>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded border border-emerald-100">
                Operational
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{branch.name}</h3>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin size={14} className="text-slate-400" />
                {branch.location}
              </div>
              {branch.phone && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone size={14} className="text-slate-400" />
                  {branch.phone}
                </div>
              )}
            </div>
            <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-colors group/btn">
              Manage Terminal
              <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}

        {branches.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Building2 size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No secondary outlets detected</p>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
             <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-sm tracking-tight">Expand Connectivity</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">New Branch Initialization</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                 <X size={18} />
               </button>
             </div>
             <form onSubmit={handleAddBranch} className="p-8 space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Outlet Identification (Name)</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    placeholder="e.g. Westlands Branch"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Geographical Matrix (Location)</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    placeholder="e.g. Sarit Centre, 2nd Floor"
                    value={newBranch.location}
                    onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Communication Link (Branch Phone)</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    placeholder="07XX XXX XXX"
                    value={newBranch.phone}
                    onChange={e => setNewBranch({...newBranch, phone: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Activate Outlet
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
