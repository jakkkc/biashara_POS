import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Plus, Calendar, Tag, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function Expenses() {
  const { business } = useAuth();
  
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Expense Tracking</h1>
            <p className="text-zinc-500">Record utilities, wages and other business costs.</p>
          </div>
          <button className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all">
            <Plus size={20} />
            Log Expense
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
             <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total This Month</p>
             <h3 className="text-3xl font-black">{formatCurrency(45300)}</h3>
             <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
                <ChevronDown size={14} className="text-emerald-300" />
                <span className="font-bold">-5%</span> from last month
             </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-around">
             <div className="text-center">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Utilities</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(12000)}</p>
             </div>
             <div className="w-px h-10 bg-zinc-100"></div>
             <div className="text-center">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Staff Wages</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(25000)}</p>
             </div>
             <div className="w-px h-10 bg-zinc-100"></div>
             <div className="text-center">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Rent</p>
                <p className="text-lg font-bold text-zinc-900">{formatCurrency(8300)}</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 font-bold text-zinc-900">Recent Expenses</div>
          <div className="p-6 text-center text-zinc-400 italic py-12">
             No expenses recorded yet. Click 'Log Expense' to get started.
          </div>
       </div>
    </div>
  );
}
