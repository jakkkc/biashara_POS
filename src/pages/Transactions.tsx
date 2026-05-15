import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, FileText, Download, Share2 } from 'lucide-react';

export default function Transactions() {
  const { business } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    const q = query(
      collection(db, `businesses/${business.id}/transactions`), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ ...doc.data() as Transaction, id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [business]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Sales History</h1>
        <p className="text-zinc-500">View and manage all your business transactions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] uppercase font-bold text-zinc-400 tracking-widest border-b border-zinc-100">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{tx.id.slice(0, 12).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{formatDate(tx.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{tx.items.length} items</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 text-right">{formatCurrency(tx.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"><Download size={16} /></button>
                    <button className="p-2 text-zinc-400 hover:text-green-600 transition-colors"><Share2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">No transactions found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
