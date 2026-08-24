import React, { useState, useEffect } from 'react';
import { api, ProductItem, ProductPlanItem } from '../services/api';
import {
  Package,
  Plus,
  MonitorCheck,
  KeyRound,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState({
    productCode: '',
    name: '',
    description: '',
    version: '4.2.0',
    status: 'ACTIVE' as const,
  });

  const [planForm, setPlanForm] = useState({
    productId: '',
    planCode: '',
    name: '',
    billingPeriod: 'YEARLY',
    price: 12000,
    maxTerminals: 2,
    maxUsers: 5,
    description: '',
    status: 'ACTIVE' as const,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts();
      if (res.success) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setSelectedProductId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load products catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createProduct(productForm);
      if (res.success) {
        setFormSuccess('New POS Product registered successfully!');
        setIsCreateProductOpen(false);
        setProductForm({ productCode: '', name: '', description: '', version: '4.2.0', status: 'ACTIVE' });
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createProductPlan({ ...planForm, productId: selectedProductId });
      if (res.success) {
        setFormSuccess('New subscription plan added successfully!');
        setIsCreatePlanOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create product plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-brand-600" size={24} /> POS Products & Subscription Plans Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage POS software products, software version releases, and annual/multi-year subscription tier pricing.
          </p>
        </div>
        <button
          onClick={() => {
            const randomCode = `PROD-${Math.floor(100 + Math.random() * 900)}`;
            setProductForm({ productCode: randomCode, name: '', description: '', version: '4.2.0', status: 'ACTIVE' });
            setFormError(null);
            setIsCreateProductOpen(true);
          }}
          className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
        >
          <Plus size={18} /> Register POS Product
        </button>
      </div>

      {/* Toast Feedback */}
      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Product Cards Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Loader2 size={24} className="animate-spin inline-block mb-2 text-brand-600" />
            <p className="text-sm font-semibold">Loading product catalog...</p>
          </div>
        ) : (
          products.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                      {p.productCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      v{p.version || '1.0.0'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'Enterprise POS billing and inventory solution.'}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MonitorCheck size={14} className="text-emerald-600" /> {p.installationCount} installs
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <KeyRound size={14} className="text-sky-600" /> {p.licenseCount} keys
                    </span>
                  </div>
                  <span className="font-bold text-brand-600 flex items-center">
                    {p.plans.length} plans <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Product Plans Workspace */}
      {selectedProduct && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="text-brand-600" size={20} />
                Subscription Plans for <span className="text-brand-700">{selectedProduct.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configured license pricing tiers, terminal constraints, and billing cycles.
              </p>
            </div>
            <button
              onClick={() => {
                const randomPlanCode = `PLAN-${Math.floor(10 + Math.random() * 90)}`;
                setPlanForm({
                  productId: selectedProduct.id,
                  planCode: randomPlanCode,
                  name: '',
                  billingPeriod: 'YEARLY',
                  price: 12000,
                  maxTerminals: 2,
                  maxUsers: 5,
                  description: '',
                  status: 'ACTIVE',
                });
                setFormError(null);
                setIsCreatePlanOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus size={14} /> Add Subscription Plan
            </button>
          </div>

          {selectedProduct.plans.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No subscription plans created yet</p>
              <p className="text-xs mt-1">Click "Add Subscription Plan" to configure pricing tiers for this POS product.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {selectedProduct.plans.map((plan) => (
                <div key={plan.id} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 shadow-2xs transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {plan.planCode}
                      </span>
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {plan.billingPeriod}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">{plan.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{plan.description || 'Standard POS license plan'}</p>

                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900">₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400 font-medium">/ {plan.billingPeriod.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600 font-medium">
                      <p>✓ Max Terminals: <strong>{plan.maxTerminals} POS Counter(s)</strong></p>
                      <p>✓ Max Users: <strong>{plan.maxUsers} Operator(s)</strong></p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      {plan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isCreateProductOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Register POS Software Product</h3>
              <button onClick={() => setIsCreateProductOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.productCode}
                    onChange={(e) => setProductForm({ ...productForm, productCode: e.target.value })}
                    placeholder="PROD-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Version *</label>
                  <input
                    type="text"
                    required
                    value={productForm.version}
                    onChange={(e) => setProductForm({ ...productForm, version: e.target.value })}
                    placeholder="4.2.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="POS Retail Standard Edition"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Complete retail billing, inventory, and GST filing system."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {isCreatePlanOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Subscription Plan</h3>
              <button onClick={() => setIsCreatePlanOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Code *</label>
                  <input
                    type="text"
                    required
                    value={planForm.planCode}
                    onChange={(e) => setPlanForm({ ...planForm, planCode: e.target.value })}
                    placeholder="STD-ANNUAL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Period *</label>
                  <select
                    value={planForm.billingPeriod}
                    onChange={(e) => setPlanForm({ ...planForm, billingPeriod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="YEARLY">YEARLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="HALF_YEARLY">HALF_YEARLY</option>
                    <option value="LIFETIME">LIFETIME</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Standard Annual Plan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Terminals</label>
                  <input
                    type="number"
                    required
                    value={planForm.maxTerminals}
                    onChange={(e) => setPlanForm({ ...planForm, maxTerminals: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Users</label>
                  <input
                    type="number"
                    required
                    value={planForm.maxUsers}
                    onChange={(e) => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePlanOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
