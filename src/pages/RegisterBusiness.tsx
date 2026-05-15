import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { COUNTIES, BUSINESS_CATEGORIES } from '../constants';
import { Building2, Save } from 'lucide-react';

export default function RegisterBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    county: '',
    town: '',
    phone: '',
    ownerName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const businessRef = doc(collection(db, 'businesses'));
      const businessId = businessRef.id;

      // 1. Create Business
      await setDoc(businessRef, {
        name: formData.name,
        category: formData.category,
        county: formData.county,
        town: formData.town,
        phone: formData.phone,
        ownerEmail: user.email,
        status: 'active',
        settings: {
          currency: 'KES',
          vatEnabled: false,
          vatRate: 16,
          language: 'en',
          themeColor: '#3b82f6',
        },
        createdAt: new Date().toISOString(),
      });

      // 2. Update User Profile
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.ownerName,
        email: user.email,
        businessId: businessId,
        role: 'owner',
        createdAt: new Date().toISOString(),
      });

      // 3. Create Default Branch
      await setDoc(doc(collection(db, `businesses/${businessId}/branches`)), {
        name: 'Main Branch',
        location: formData.town,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error creating business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white relative">
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Business Setup</h1>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Operations Initialization</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Enterprise Designation (Business Name)</label>
              <input
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mwaniki Bakery & Supplies"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Business Category</label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {BUSINESS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Regional Domain (County)</label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={formData.county}
                onChange={e => setFormData({ ...formData, county: e.target.value })}
              >
                <option value="">Select County</option>
                {COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Town/Location</label>
              <input
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={formData.town}
                onChange={e => setFormData({ ...formData, town: e.target.value })}
                placeholder="e.g. Ruiru"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Communication Link (Phone)</label>
              <input
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712 345 678"
              />
            </div>

            <div className="md:col-span-2 pt-8 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primary Operator Name (Owner)</label>
              <input
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Jackson Mwaniki"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            <Save size={18} />
            {loading ? 'Initializing Enterprise...' : 'Activate My Biashara'}
          </button>
        </form>
      </div>
    </div>
  );
}
