import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, orderBy, addDoc, doc, deleteDoc, collectionGroup, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Wallet, Plus, Calendar, Tag, ChevronDown, Trash2, X, CheckCircle, Building2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuditLogger } from '../lib/audit';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Expenses() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 0,
    category: 'Utilities',
    branchId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!business?.id || !profile) return;

    let q;
    if (profile.role === 'owner') {
      q = query(
        collectionGroup(db, 'expenses'),
        where('businessId', '==', business.id),
        orderBy('date', 'desc')
      );
    } else if (profile.branchId) {
      q = query(
        collection(db, `businesses/${business.id}/branches/${profile.branchId}/expenses`),
        orderBy('date', 'desc')
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    const bq = query(collection(db, `businesses/${business.id}/branches`));
    const unsubscribeBranches = onSnapshot(bq, (snap) => {
      setBranches(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubscribe();
      unsubscribeBranches();
    };
  }, [business?.id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !profile) return;

    const targetBranchId = newExpense.branchId || profile.branchId;
    if (!targetBranchId) return;

    try {
      const docRef = await addDoc(collection(db, `businesses/${business.id}/branches/${targetBranchId}/expenses`), {
        ...newExpense,
        branchId: targetBranchId,
        businessId: business.id,
        createdAt: new Date().toISOString(),
        recordedBy: profile.id
      });

      await log('EXPENSE_RECORDED', {
        expenseId: docRef.id,
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
        branchId: targetBranchId
      }, profile, business);

      setShowAddModal(false);
      setNewExpense({
        title: '',
        amount: 0,
        category: 'Utilities',
        branchId: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert('Error recording expense');
    }
  };

  const deleteExpense = async (id: string, title: string, expenseBranchId?: string) => {
    const targetBranchId = expenseBranchId || profile?.branchId;
    if (!business || !profile || !targetBranchId || !window.confirm(`Delete expense "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/branches/${targetBranchId}/expenses`, id));
      await log('EXPENSE_DELETED', { expenseId: id, title, branchId: targetBranchId }, profile, business);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `branches/${targetBranchId}/expenses/${id}`);
    }
  };

  const totalThisMonth = expenses
    .filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Main Office';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expense Tracking</h1>
            <p className="text-slate-500 text-sm">Record utilities, wages and other business costs in real-time.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-100"
          >
            <Plus size={20} />
            Log Expense
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-xl shadow-indigo-100">
             <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-2">Total Monthly Spend</p>
             <h3 className="text-4xl font-black">{formatCurrency(totalThisMonth)}</h3>
             <div className="mt-4 flex items-center gap-2 text-xs text-indigo-100">
                <ChevronDown size={14} className="text-emerald-300" />
                <span className="font-bold">-2.4%</span> vs prior cycle
             </div>
          </div>
          
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 gap-4 items-center">
             <div className="text-center px-4 border-r border-slate-100">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Infrastructure</p>
                <p className="text-lg font-black text-slate-800">
                  {formatCurrency(expenses.filter(e => e.category === 'Utilities').reduce((a, b) => a + b.amount, 0))}
                </p>
             </div>
             <div className="text-center px-4 border-r border-slate-100">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Personnel</p>
                <p className="text-lg font-black text-slate-800">
                  {formatCurrency(expenses.filter(e => e.category === 'Wages').reduce((a, b) => a + b.amount, 0))}
                </p>
             </div>
             <div className="text-center px-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Operational</p>
                <p className="text-lg font-black text-slate-800">
                  {formatCurrency(expenses.filter(e => e.category === 'Other').reduce((a, b) => a + b.amount, 0))}
                </p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
            <span className="text-sm">Audit Trail: Expenses</span>
            <Tag size={16} className="text-slate-400" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Designation</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimension (Branch)</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monetary Volume</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{expense.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{expense.date}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Building2 size={12} className="text-slate-400" />
                        {getBranchName(expense.branchId)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-sm font-black text-rose-600">{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id, expense.title, expense.branchId)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Wallet size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No spectral expenses detected in this cycle</p>
              </div>
            )}
          </div>
       </div>

       {/* Add Expense Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-sm tracking-tight">Record Financial Outflow</h3>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Expense Protocol Initiation</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Outcome Descriptor (Title)</label>
                   <input
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                     placeholder="e.g. Electricity Bill May"
                     value={newExpense.title}
                     onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Monetary Volume (Amount)</label>
                      <input
                        required
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all font-bold"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dimension (Branch)</label>
                      <select
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        value={newExpense.branchId}
                        onChange={e => setNewExpense({...newExpense, branchId: e.target.value})}
                      >
                        <option value="">Main Office</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category Vector</label>
                      <select
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        value={newExpense.category}
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                      >
                        <option value="Utilities">Utilities</option>
                        <option value="Wages">Personnel (Wages)</option>
                        <option value="Rent">Estate (Rent)</option>
                        <option value="Marketing">Growth (Marketing)</option>
                        <option value="Inventory">Asset Procurement</option>
                        <option value="Other">Miscellaneous (Other)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Temporal Marker (Date)</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all font-medium"
                        value={newExpense.date}
                        onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                 </div>
                 <button
                   type="submit"
                   className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                 >
                   <CheckCircle size={18} />
                   Authorize Outflow
                 </button>
              </form>
            </div>
         </div>
       )}
    </div>
  );
}
