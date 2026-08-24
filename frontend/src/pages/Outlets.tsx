import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, OutletItem } from '../services/api';
import { Store, Search, Loader2, MapPin, Phone, Building2 } from 'lucide-react';

export const OutletsPage: React.FC = () => {
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOutlets();
  }, [search]);

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOutlets({ search });
      if (res.success) {
        setOutlets(res.data);
      }
    } catch (err) {
      console.error('Failed to load outlets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="text-brand-600" size={24} /> Customer Outlets & Branches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global directory of all client retail branch locations and deployed store outlets.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search outlet code, branch name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Outlet Code</th>
                <th className="px-5 py-3">Branch Name</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Incharge & Phone</th>
                <th className="px-5 py-3 text-center">Installations</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading outlets...
                  </td>
                </tr>
              ) : outlets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No outlets found.
                  </td>
                </tr>
              ) : (
                outlets.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">{o.outletCode}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{o.outletName}</td>
                    <td className="px-5 py-3.5">
                      {o.customer ? (
                        <Link to={`/customers/${o.customer.id}`} className="font-semibold text-brand-600 hover:underline flex items-center gap-1">
                          <Building2 size={14} /> {o.customer.businessName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" /> {o.city || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{o.contactPerson || '—'}</p>
                      {o.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone size={10} /> {o.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700 text-xs">{o._count?.installations || 0}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          o.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
