import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
// ... existing imports
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  CreditCardIcon,
  Smartphone,
  Wallet,
  Menu,
  ChevronRight,
  Package,
  X,
  Users
} from 'lucide-react';
import { Product, TransactionItem, PaymentMethod } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useAuditLogger } from '../lib/audit';

export default function POS() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [amountReceived, setAmountReceived] = useState<string>('');

  useEffect(() => {
    if (!business?.id || !profile?.branchId) return;
    
    const q = query(collection(db, `businesses/${business.id}/branches/${profile.branchId}/products`));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ ...doc.data() as Product, id: doc.id })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `branches/${profile.branchId}/products`);
    });

    return () => unsubscribe();
  }, [business?.id, profile?.branchId]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as TransactionItem[]);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const vat = (business?.settings?.vatEnabled) ? subtotal * (business.settings.vatRate / 100) : 0;
  const total = subtotal + vat;

  const handleCheckout = async () => {
    if (!business || !profile?.branchId) return;
    
    const transaction = {
      businessId: business.id,
      branchId: profile.branchId,
      cashierId: profile.id,
      items: cart.map(item => ({...item, businessId: business.id, branchId: profile.branchId})),
      subtotal,
      vat,
      total,
      amountPaid: payments.reduce((acc, p) => acc + p.amount, 0),
      paymentMethods: payments,
      status: 'paid', // Logic for partial/credit later
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, `businesses/${business.id}/branches/${profile.branchId}/transactions`), transaction);
      
      await log('SALE_CREATED', {
        transactionId: docRef.id,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity })),
        total,
        paymentMethods: payments.map(p => p.method),
        branchId: profile.branchId
      }, profile, business);

      setCart([]);
      setShowCheckout(false);
      setPayments([]);
      alert('Sale Completed!');
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `branches/${profile.branchId}/transactions`);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in duration-500">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4 bg-white p-3 border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <div className="pl-2 text-slate-400"><Search size={20} /></div>
          <input
            className="flex-1 outline-none text-slate-700 bg-transparent text-sm font-medium"
            placeholder="Search items or scan barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 scrollbar-hide">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:ring-4 hover:ring-indigo-50 hover:shadow-md transition-all text-left flex flex-col group"
            >
              <div className="w-full aspect-square bg-slate-50 rounded-lg mb-4 flex items-center justify-center text-slate-300 group-hover:scale-95 transition-transform overflow-hidden border border-slate-100">
                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={32} />}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{product.category || 'Standard'}</p>
              <p className="font-bold text-slate-800 line-clamp-1 mb-2">{product.name}</p>
              <p className="text-sm font-extrabold text-indigo-600 mt-auto">{formatCurrency(product.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white leading-none">Checkout Queue</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Terminal Active</p>
            </div>
          </div>
          <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-indigo-600/50">
            {cart.length} Unit{cart.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {cart.map(item => (
            <div key={item.productId} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{item.name}</p>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatCurrency(item.price)}</p>
                   <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                   <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Total: {formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 group-hover:border-indigo-200">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:text-red-500 transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:text-indigo-600 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50 py-20">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} strokeWidth={1} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Queue Empty</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {business?.settings.vatEnabled && (
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Tax (16% VAT)</span>
                <span>{formatCurrency(vat)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-end pt-4 border-t border-slate-200">
            <div>
               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-1">TOTAL SALES</p>
               <span className="text-3xl font-black text-slate-900 leading-none">{formatCurrency(total)}</span>
            </div>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 mt-4 active:scale-95"
          >
            Initiate Settlement <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
               <div>
                  <h3 className="font-bold text-sm tracking-tight">Final Settlement</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Transaction Processing</p>
               </div>
               <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-10">
                <div className="flex justify-between items-center bg-indigo-600 p-8 rounded-xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
                   <div className="relative z-10">
                     <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Amount Payable</p>
                     <p className="text-4xl font-black">{formatCurrency(total)}</p>
                   </div>
                   <div className="text-right relative z-10">
                     <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Balance Due</p>
                     <p className="text-2xl font-bold">{formatCurrency(total - payments.reduce((acc, p) => acc + p.amount, 0))}</p>
                   </div>
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wallet size={80} />
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                   {['cash', 'mpesa', 'bank', 'card', 'credit'].map((method) => (
                     <button
                       key={method}
                       className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-500"
                     >
                       {method === 'cash' && <Wallet size={20} className="text-indigo-600" />}
                       {method === 'mpesa' && <Smartphone size={20} className="text-emerald-500" />}
                       {method === 'card' && <CreditCard size={20} className="text-amber-500" />}
                       {method === 'bank' && <CreditCardIcon size={20} className="text-blue-500" />}
                       {method === 'credit' && <Users size={20} className="text-red-500" />}
                       {method}
                     </button>
                   ))}
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Received (Manual Override)</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">KES</div>
                      <input 
                        className="w-full text-4xl font-black pl-14 pr-4 py-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200"
                        type="number"
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        autoFocus
                      />
                   </div>
                </div>
                
                <button
                   onClick={() => {
                     const amt = parseFloat(amountReceived);
                     if (amt > 0) {
                        setPayments([...payments, { method: 'cash', amount: amt }]);
                        setAmountReceived('');
                     }
                   }}
                   className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg"
                >
                  Verify & Add Line
                </button>

                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Layers</p>
                   {payments.map((p, i) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                           <span className="font-bold uppercase tracking-widest text-xs text-slate-700">{p.method}</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="font-black text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                           <button onClick={() => setPayments(payments.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                     </div>
                   ))}
                   {payments.length === 0 && (
                     <div className="py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No payments registered</p>
                     </div>
                   )}
                </div>
             </div>
             <div className="p-10 border-t border-slate-100 bg-slate-50">
               <button
                 disabled={payments.reduce((acc, p) => acc + p.amount, 0) < total}
                 onClick={handleCheckout}
                 className="w-full bg-indigo-600 text-white py-6 rounded-lg font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
               >
                 Finalize Sale
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
