import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Search, Plus, Phone, MapPin, Calculator, X, CheckCircle, Trash2, Mail } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuditLogger } from '../lib/audit';

export default function Customers() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (!business?.id) return;

    const q = query(collection(db, `businesses/${business.id}/customers`));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [business?.id]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !profile) return;

    try {
      const docRef = await addDoc(collection(db, `businesses/${business.id}/customers`), {
        ...newCustomer,
        createdAt: new Date().toISOString(),
        loyaltyPoints: 0,
        currentDebt: 0
      });

      await log('CUSTOMER_CREATED', {
        customerId: docRef.id,
        name: newCustomer.name,
        phone: newCustomer.phone
      }, profile, business);

      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Error adding customer');
    }
  };

  const deleteCustomer = async (id: string, name: string) => {
    if (!business || !profile || !window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/customers`, id));
      await log('CUSTOMER_DELETED', { customerId: id, name }, profile, business);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const totalDebt = customers.reduce((acc, c) => acc + (c.currentDebt || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Directory</h1>
            <p className="text-slate-500 text-sm">Manage enterprise relationships and credit portfolios.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            New Customer
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 italic font-serif">
                <Users size={28} />
             </div>
             <div>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{customers.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Relationships</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
             <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
                <Calculator size={28} />
             </div>
             <div>
                <p className="text-3xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalDebt)}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Outstanding Credits</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                placeholder="Search customers by name or phone..." 
                className="w-full bg-transparent outline-none text-sm font-medium text-slate-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Protocol</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Status</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loyalty Score</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{customer.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{customer.email || 'No email registered'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone size={12} className="text-slate-400" />
                          {customer.phone}
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                             <MapPin size={10} />
                             {customer.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                        customer.currentDebt > 0 
                          ? "bg-rose-50 text-rose-600 border-rose-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {customer.currentDebt > 0 ? formatCurrency(customer.currentDebt) : 'Clear'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-800 text-sm">
                      {customer.loyaltyPoints}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => deleteCustomer(customer.id, customer.name)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No customer entities detected in this sector</p>
              </div>
            )}
          </div>
       </div>

       {/* Add Customer Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-sm tracking-tight">Expand CRM Database</h3>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Customer Entry Protocol</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legal Identity (Full Name)</label>
                   <input
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                     placeholder="Jackson Mwaniki"
                     value={newCustomer.name}
                     onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Phone Link</label>
                      <input
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        placeholder="07XX XXX XXX"
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Digital ID (Email)</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        placeholder="customer@example.com"
                        value={newCustomer.email}
                        onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                      />
                    </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Geographical Vector (Address)</label>
                   <input
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                     placeholder="e.g. Unit 4, Westlands Business Park"
                     value={newCustomer.address}
                     onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                   />
                 </div>
                 <button
                   type="submit"
                   className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                 >
                   <CheckCircle size={18} />
                   Register Customer Entity
                 </button>
              </form>
            </div>
         </div>
       )}
    </div>
  );
}
