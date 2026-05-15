import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { Plus, Search, Package, Trash2, Edit2, AlertCircle, X } from 'lucide-react';
import { useAuditLogger } from '../lib/audit';

export default function Inventory() {
  const { business, profile } = useAuth();
  const { log } = useAuditLogger();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    buyingPrice: 0,
    sellingPrice: 0,
    minStock: 5,
    unit: 'pcs',
    categoryId: 'default'
  });

  const fetchProducts = async () => {
    if (!business) return;
    const snap = await getDocs(collection(db, `businesses/${business.id}/products`));
    setProducts(snap.docs.map(doc => ({ ...doc.data() as Product, id: doc.id })));
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [business]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    try {
      const docRef = await addDoc(collection(db, `businesses/${business.id}/products`), {
        ...newProduct,
        businessId: business.id,
        currentStock: { main: 0 },
        vatApplicable: true,
        createdAt: new Date().toISOString()
      });

      if (profile) {
        await log('PRODUCT_CREATED', {
          productId: docRef.id,
          name: newProduct.name,
          sku: newProduct.sku
        }, profile, business);
      }

      setShowAddModal(false);
      fetchProducts();
      setNewProduct({
        name: '',
        sku: '',
        buyingPrice: 0,
        sellingPrice: 0,
        minStock: 5,
        unit: 'pcs',
        categoryId: 'default'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!business || !profile || !window.confirm(`Delete product "${name}"?`)) return;
    
    await deleteDoc(doc(db, `businesses/${business.id}/products`, id));
    
    await log('PRODUCT_DELETED', {
      productId: id,
      name
    }, profile, business);

    fetchProducts();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Control and monitor enterprise resources across all domains.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 self-start md:self-auto"
        >
          <Plus size={18} />
          Register Unit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search by name, SKU or category..."
              className="bg-transparent outline-none text-xs w-full font-medium text-slate-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identifier (SKU)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acquisition</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Retail Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status/Volume</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors border border-slate-100">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none mb-1">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-slate-400 tracking-tighter">{product.sku}</td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-500 text-right">{formatCurrency(product.buyingPrice)}</td>
                  <td className="px-6 py-4 font-black text-slate-900 text-right">{formatCurrency(product.sellingPrice)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <span className={cn(
                         "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                         (Object.values(product.currentStock || {}).reduce((a: number, b: number) => a + b, 0)) <= product.minStock
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                       )}>
                         {Object.values(product.currentStock || {}).reduce((a: number, b: number) => a + b, 0)} Units
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
             <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-sm tracking-tight">New Asset Entry</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Resource Registration</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
                 <X size={18} />
               </button>
             </div>
             <form onSubmit={handleAddProduct} className="p-8 space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asset Designation (Name)</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    placeholder="e.g. White Bread 400g"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">System ID (SKU)</label>
                    <input
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newProduct.sku}
                      onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unit Scale</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={newProduct.unit}
                      onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="litres">Litres (l)</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Acquisition Cost</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all font-bold"
                      value={newProduct.buyingPrice}
                      onChange={e => setNewProduct({...newProduct, buyingPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Retail Valuation</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all font-bold text-indigo-600"
                      value={newProduct.sellingPrice}
                      onChange={e => setNewProduct({...newProduct, sellingPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Commit to Registry
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
