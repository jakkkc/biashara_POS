import { useAuth } from '../hooks/useAuth';
import { THEME_COLORS, COUNTIES } from '../constants';
import { Save, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Settings() {
  const { business } = useAuth();

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Settings</h1>
        <p className="text-slate-500 text-sm">Configure core business parameters and operation preferences.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 font-bold text-[10px] uppercase tracking-widest text-slate-400">Core Profile Identity</div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Enterprise Designation</label>
               <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-700" defaultValue={business?.name} />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Communication Link</label>
               <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-700" defaultValue={business?.phone} />
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
              <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer ring-4 ring-indigo-50">
                 <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm"></div>
              </div>
           </div>
           
           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Terminal Receipt Validation (Footer Signature)</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32 text-sm font-medium text-slate-600"
                defaultValue={business?.settings?.receiptFooter || "Asante kwa ununuzi! Karibu tena. Ni furaha kukuwahudumia."}
              />
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
         <button className="px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Reset Changes</button>
         <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3">
           <Save size={16} />
           Commit Parameters
         </button>
      </div>
    </div>
  );
}
