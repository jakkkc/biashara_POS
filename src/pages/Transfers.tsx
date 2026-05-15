import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, getDocs, runTransaction, collectionGroup, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Truck, Search, Plus, Filter, ArrowRight, X, CheckCircle, Package, Building2 } from 'lucide-react';
import { useAuditLogger } from '../lib/audit';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Transfers() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTransfer, setNewTransfer] = useState({
    productId: '',
    quantity: 0,
    fromBranchId: '',
    toBranchId: '',
    status: 'pending' // pending, completed, cancelled
  });

  useEffect(() => {
    if (!business?.id || !profile) return;

    // Transfers can be viewed by anyone with access, but filtered or restricted as needed
    const q = query(collection(db, `businesses/${business.id}/stockTransfers`));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTransfers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stockTransfers');
    });

    const bq = query(collection(db, `businesses/${business.id}/branches`));
    const unsubscribeBranches = onSnapshot(bq, (snap) => {
      setBranches(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // Fetch products from ALL branches to allow cross-branch selection
    let pq;
    if (profile.role === 'owner') {
      pq = query(collectionGroup(db, 'products'), where('businessId', '==', business.id));
    } else if (profile.branchId) {
      // Still allow seeing other products for transfers? 
      // For now, owners handle cross-branch or manager can see all products in business
      pq = query(collectionGroup(db, 'products'), where('businessId', '==', business.id));
    } else {
      return;
    }

    const unsubscribeProducts = onSnapshot(pq, (snap) => {
      setProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubscribe();
      unsubscribeBranches();
      unsubscribeProducts();
    };
  }, [business?.id, profile?.role, profile?.branchId]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !profile) return;

    const product = products.find(p => p.id === newTransfer.productId);
    if (!product) return;

    try {
      const docRef = await addDoc(collection(db, `businesses/${business.id}/stockTransfers`), {
        ...newTransfer,
        productName: product.name,
        productSku: product.sku, // Store SKU to match across branches
        businessId: business.id,
        createdAt: new Date().toISOString(),
        createdBy: profile.id
      });

      await log('TRANSFER_CREATED', {
        transferId: docRef.id,
        productName: product.name,
        quantity: newTransfer.quantity
      }, profile, business);

      setShowAddModal(false);
      setNewTransfer({ productId: '', quantity: 0, fromBranchId: '', toBranchId: '', status: 'pending' });
    } catch (err) {
      console.error(err);
      alert('Error creating transfer');
    }
  };

  const completeTransfer = async (transfer: any) => {
    if (!business || !profile) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        // Find product docs in BOTH source and target branches by SKU
        const sourceQuery = query(
          collection(db, `businesses/${business.id}/branches/${transfer.fromBranchId}/products`),
          where('sku', '==', transfer.productSku)
        );
        const targetQuery = query(
          collection(db, `businesses/${business.id}/branches/${transfer.toBranchId}/products`),
          where('sku', '==', transfer.productSku)
        );

        const [sourceSnap, targetSnap] = await Promise.all([
          getDocs(sourceQuery),
          getDocs(targetQuery)
        ]);

        if (sourceSnap.empty) throw new Error(`Product not found in source branch!`);
        if (targetSnap.empty) throw new Error(`Product not found in target branch!`);

        const sourceDoc = sourceSnap.docs[0];
        const targetDoc = targetSnap.docs[0];

        const sourceData = sourceDoc.data();
        const targetData = targetDoc.data();

        if ((sourceData.stock || 0) < transfer.quantity) {
          throw new Error(`Insufficient stock in source branch! (${sourceData.stock} available)`);
        }

        // Deduct from source
        transaction.update(sourceDoc.ref, { 
          stock: (sourceData.stock || 0) - transfer.quantity,
          updatedAt: new Date().toISOString()
        });

        // Add to target
        transaction.update(targetDoc.ref, { 
          stock: (targetData.stock || 0) + transfer.quantity,
          updatedAt: new Date().toISOString()
        });
        
        transaction.update(doc(db, `businesses/${business.id}/stockTransfers`, transfer.id), { 
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: profile.id
        });
      });

      await log('TRANSFER_COMPLETED', {
        transferId: transfer.id,
        productName: transfer.productName,
        quantity: transfer.quantity
      }, profile, business);

    } catch (err) {
      console.error(err);
      alert('Transfer failed: ' + err);
    }
  };

  const cancelTransfer = async (transfer: any) => {
    if (!business || !profile) return;
    try {
      await updateDoc(doc(db, `businesses/${business.id}/stockTransfers`, transfer.id), { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      await log('TRANSFER_CANCELLED', { transferId: transfer.id }, profile, business);
    } catch (err) {
      console.error(err);
    }
  };

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Main Office';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Logistics</h1>
            <p className="text-slate-500 text-sm">Coordinate product movement across your enterprise network.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg"
          >
            <Plus size={20} />
            Initialize Transfer
          </button>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Movement Registry</h2>
             <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><Filter size={18} /></button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Details</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Routing (From → To)</th>
                  <th className="text-center py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</th>
                  <th className="text-center py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">State</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(transfer => (
                  <tr key={transfer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                            <Package size={16} />
                         </div>
                         <p className="text-sm font-bold text-slate-800">{transfer.productName}</p>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                         <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">{getBranchName(transfer.fromBranchId)}</span>
                         <ArrowRight size={14} className="text-slate-300" />
                         <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">{getBranchName(transfer.toBranchId)}</span>
                       </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <p className="text-sm font-black text-slate-800">{transfer.quantity}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                         transfer.status === 'completed' ? "bg-emerald-50 text-emerald-600" : 
                         transfer.status === 'cancelled' ? "bg-rose-50 text-rose-600" : 
                         "bg-amber-50 text-amber-600"
                       )}>
                         {transfer.status}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                       {transfer.status === 'pending' && (
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => cancelTransfer(transfer)}
                             className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
                           >
                             Abort
                           </button>
                           <button 
                             onClick={() => completeTransfer(transfer)}
                             className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                           >
                             Finalize
                           </button>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transfers.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Truck size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No logistical movements recorded</p>
              </div>
            )}
          </div>
       </div>

       {/* New Transfer Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-sm tracking-tight">Stock Vector Redistribution</h3>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Resource Relocation Protocol</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateTransfer} className="p-8 space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Asset (Product)</label>
                   <select
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                     value={newTransfer.productId}
                     onChange={e => setNewTransfer({...newTransfer, productId: e.target.value})}
                   >
                     <option value="">Select Resource</option>
                     {products.map(p => (
                       <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                     ))}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Origin Dimension (From)</label>
                      <select
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        value={newTransfer.fromBranchId}
                        onChange={e => setNewTransfer({...newTransfer, fromBranchId: e.target.value})}
                      >
                        <option value="">Main Office</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Dimension (To)</label>
                      <select
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        value={newTransfer.toBranchId}
                        onChange={e => setNewTransfer({...newTransfer, toBranchId: e.target.value})}
                      >
                        <option value="">Main Office</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transfer Volume (Quantity)</label>
                   <input
                     required
                     type="number"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all font-black text-slate-800"
                     value={newTransfer.quantity}
                     onChange={e => setNewTransfer({...newTransfer, quantity: parseInt(e.target.value)})}
                   />
                 </div>
                 <button
                   type="submit"
                   className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                 >
                   <Truck size={18} />
                   Request Relocation
                 </button>
              </form>
            </div>
         </div>
       )}
    </div>
  );
}
