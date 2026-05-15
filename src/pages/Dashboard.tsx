import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, TrendingUp, Users, Wallet, CreditCard, ShoppingBag, AlertTriangle, Plus } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const { business, profile } = useAuth();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    transactionCount: 0,
    outstandingCredits: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    if (!business) return;

    // Realtime listeners for stats would go here
    // For now, let's setup some mock trends and structure
  }, [business]);

  const mockRevenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 6000 },
    { name: 'Thu', revenue: 8000 },
    { name: 'Fri', revenue: 5000 },
    { name: 'Sat', revenue: 12000 },
    { name: 'Sun', revenue: 9000 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {trend && (
            <p className={cn("text-xs mt-2 font-medium flex items-center gap-1", trend > 0 ? "text-emerald-600" : "text-red-600")}>
              <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
              {Math.abs(trend)}% vs yesterday
            </p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg bg-slate-50 text-slate-400")}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Habari, {profile?.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm">Here's a snapshot of {business?.name} today.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm shadow-indigo-100">
              <Plus size={16} />
              New Sale
           </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={formatCurrency(stats.todayRevenue)}
          icon={Wallet}
          color="bg-indigo-600"
          trend={12}
        />
        <StatCard 
          title="Transactions" 
          value={stats.transactionCount}
          icon={ShoppingBag}
          color="bg-emerald-600"
          trend={5}
        />
        <StatCard 
          title="Credit Owed" 
          value={formatCurrency(stats.outstandingCredits)}
          icon={CreditCard}
          color="bg-amber-600"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="bg-red-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Revenue Trends</h4>
            <select className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-500">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{fill: '#4f46e5', strokeWidth: 2, r: 4}} 
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Top Products</h4>
            <button className="text-[10px] font-bold text-indigo-600 uppercase">View All</button>
          </div>
          <div className="flex-1 overflow-auto">
             <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {[1,2,3,4,5].map(i => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">Premium Product {i}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Electronics</p>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-slate-800">12k</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">+12%</p>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
