import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { COUNTIES, BUSINESS_CATEGORIES } from '../constants';
import { Building2, Save, CheckCircle } from 'lucide-react';
import { Business } from '../types';
import { cn } from '../lib/utils';

export default function RegisterBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingBiz, setExistingBiz] = useState<Business | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    county: '',
    town: '',
    phone: '',
    ownerName: '',
  });

  useEffect(() => {
    async function checkExisting() {
      if (!user?.email) {
        setCheckingExisting(false);
        return;
      }
      try {
        const q = query(collection(db, 'businesses'), where('ownerEmail', '==', user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setExistingBiz({ ...snap.docs[0].data(), id: snap.docs[0].id } as Business);
          const data = snap.docs[0].data();
          setFormData(prev => ({
             ...prev,
             name: data.name,
             category: data.category,
             county: data.county,
             town: data.town,
             phone: data.phone,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingExisting(false);
      }
    }
    checkExisting();
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let businessId = existingBiz?.id;

      if (!existingBiz) {
        const businessRef = doc(collection(db, 'businesses'));
        businessId = businessRef.id;
      }

      // 1. Create/Update User Profile (MUST happen first to grant "owner" permissions)
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.ownerName,
        email: user.email,
        businessId: businessId,
        role: 'owner',
        createdAt: new Date().toISOString(),
      });

      if (!existingBiz) {
        // 2. Create Business Document
        await setDoc(doc(db, 'businesses', businessId!), {
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

        // 3. Create Default Branch (and capture its ID)
        const branchRef = doc(collection(db, `businesses/${businessId}/branches`));
        const branchId = branchRef.id;
        
        await setDoc(branchRef, {
          name: 'Main Branch',
          location: formData.town,
          phone: formData.phone,
          createdAt: new Date().toISOString(),
        });

        // 4. Update User Profile with the branchId
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.ownerName,
          email: user.email,
          businessId: businessId,
          branchId: branchId, // Assign to the main branch
          role: 'owner',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Just update the user profile for existing biz
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.ownerName,
          email: user.email,
          businessId: businessId,
          role: 'owner',
          createdAt: new Date().toISOString(),
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Registration Error:', err);
      // More descriptive error if possible
      if (err instanceof Error) {
         alert(`Error: ${err.message}`);
      } else {
         alert('Error creating business. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
          {!user ? 'Authorizing Operator' : 'Verifying Identity Meta-Data'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white relative">
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {existingBiz ? 'Claim Enterprise' : 'Business Setup'}
              </h1>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">
                {existingBiz ? 'Account Linkage' : 'Operations Initialization'}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
        </div>

        {existingBiz && (
           <div className="p-10 bg-indigo-50/50 border-b border-indigo-100 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-900 mb-1">Business Identity Found</p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  The Super Admin has already registered <strong>{existingBiz.name}</strong> for this email. 
                  Provide your name below to complete the secure linkage process.
                </p>
              </div>
           </div>
        )}

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {!existingBiz && (
              <>
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
              </>
            )}

            <div className={cn("md:col-span-2 pt-8", !existingBiz && "border-t border-slate-100")}>
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
            {loading ? 'Initializing Enterprise...' : existingBiz ? 'Commit Linkage' : 'Activate My Biashara'}
          </button>
        </form>
      </div>
    </div>
  );
}
