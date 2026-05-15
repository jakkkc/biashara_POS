import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { THEME_COLORS, COUNTIES } from '../constants';
import { Save, LogOut, CheckCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuditLogger } from '../lib/audit';

export default function Settings() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: business?.name || '',
    phone: business?.phone || '',
    receiptFooter: business?.settings?.receiptFooter || "Asante kwa ununuzi! Karibu tena. Ni furaha kukuwahudumia.",
    vatEnabled: business?.settings?.vatEnabled ?? true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !profile) return;
    setLoading(true);

    try {
      const bizRef = doc(db, 'businesses', business.id);
      await updateDoc(bizRef, {
        name: formData.name,
        phone: formData.phone,
        'settings.receiptFooter': formData.receiptFooter,
        'settings.vatEnabled': formData.vatEnabled,
      });

      await log('BUSINESS_SETTINGS_CHANGED', {
        fields: Object.keys(formData)
      }, profile, business);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Settings</h1>
        <p className="text-slate-500 text-sm">Configure core business parameters and operation preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 font-bold text-[10px] uppercase tracking-widest text-slate-400">Core Profile Identity</div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Enterprise Designation</label>
                 <input 
                   required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-700" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Communication Link</label>
                 <input 
                   required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-700" 
                   value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                 />
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 font-bold text-[10px] uppercase tracking-widest text-slate-400">Financial & Extraction Protocols</div>
          <div className="p-8 space-y-10">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800 text-sm uppercase tracking-tight">KRA VAT Compliance</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Automated sales tax at standard 16.0%</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, vatEnabled: !formData.vatEnabled})}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300",
                    formData.vatEnabled ? "bg-indigo-600 ring-4 ring-indigo-50" : "bg-slate-200"
                  )}
                >
                   <div className={cn(
                     "absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300",
                     formData.vatEnabled ? "right-1" : "left-1"
                   )}></div>
                </div>
             </div>
             
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Terminal Receipt Validation (Footer Signature)</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32 text-sm font-medium text-slate-600"
                  value={formData.receiptFooter}
                  onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                />
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
           <button 
             type="button"
             onClick={() => window.location.reload()}
             className="px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
           >
             Reset Changes
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 disabled:opacity-50"
           >
             {success ? <CheckCircle size={16} /> : <Save size={16} />}
             {loading ? 'Processing...' : success ? 'Commit Validated' : 'Commit Parameters'}
           </button>
        </div>
      </form>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
