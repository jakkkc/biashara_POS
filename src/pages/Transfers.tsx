import { Truck, Search, Plus, Filter, ArrowRight } from 'lucide-react';

export default function Transfers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Stock Transfers</h1>
            <p className="text-zinc-500">Move products between your business branches.</p>
          </div>
          <button className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all">
            <Plus size={20} />
            New Transfer
          </button>
       </div>

       <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
             <h2 className="font-bold text-zinc-900">Transfer Logs</h2>
             <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-lg"><Filter size={18} /></button>
          </div>
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mx-auto mb-4">
                <Truck size={32} />
             </div>
             <p className="text-zinc-400 italic text-sm">No transfer history recorded.</p>
          </div>
       </div>
    </div>
  );
}
