import { Users, Search, Plus, Phone, MapPin, Calculator } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function Customers() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Customer Directory</h1>
            <p className="text-zinc-500">Manage relationships and loyalty points.</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
            <Plus size={20} />
            New Customer
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400"><Users size={24} /></div>
             <div>
                <p className="text-2xl font-black text-zinc-900">142</p>
                <p className="text-xs text-zinc-500 font-bold uppercase">Total Customers</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600"><Calculator size={24} /></div>
             <div>
                <p className="text-2xl font-black text-amber-600">KES 42k</p>
                <p className="text-xs text-zinc-500 font-bold uppercase">Total Debts</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center gap-4">
            <Search size={18} className="text-zinc-400 ml-2" />
            <input placeholder="Search customers..." className="flex-1 outline-none text-sm" />
          </div>
          <div className="p-12 text-center text-zinc-400 italic">
             No customers added yet. Build your CRM to track credits and loyalty.
          </div>
       </div>
    </div>
  );
}
