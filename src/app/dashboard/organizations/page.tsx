'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type Organization,
  type OrgStatus,
  type OrgCategoryData,
} from '@/lib/types';
import Link from 'next/link';
import { Plus, Search, Filter, ChevronRight, Building2, LayoutGrid, List as ListIcon, MapPin } from 'lucide-react';
import ExcelActions from '@/components/ExcelActions';

const ALL_STATUSES: OrgStatus[] = [
  'new_lead', 'contacted', 'presented', 'quoted', 'negotiating', 'won', 'lost', 'on_hold',
];

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<OrgCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<OrgStatus | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch categories first
    const { data: catData } = await supabase.from('org_categories').select('*').order('created_at', { ascending: true });
    setCategories(catData || []);

    let query = supabase
      .from('organizations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filterCategory) query = query.eq('category', filterCategory);
    if (filterStatus) query = query.eq('status', filterStatus);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data } = await query;
    setOrgs(data || []);
    setLoading(false);
  }, [filterCategory, filterStatus, search, supabase]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Helper to get category details
  const getCategoryDetails = (catValue: string) => {
    const cat = categories.find(c => c.value === catValue);
    if (cat) return { label: cat.label, icon: cat.icon };
    return { label: catValue, icon: '🏢' };
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายชื่อองค์กร</h1>
          <p className="text-sm mt-1 text-gray-500 font-medium">
            ทั้งหมด {orgs.length} องค์กร
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="hidden sm:flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm mr-2">
            <button 
              onClick={() => setViewMode('board')} 
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Board View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>
          <ExcelActions orgs={orgs} categories={categories} onImportSuccess={fetchData} />
          <Link href="/dashboard/organizations/new" className="btn-primary shadow-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">เพิ่มองค์กร</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            className="input-field !pl-10"
            placeholder="ค้นหาชื่อองค์กร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter row */}
        <div className="flex gap-3 sm:w-1/2 lg:w-1/3">
          <div className="flex items-center gap-2 flex-1">
            <Filter size={16} className="text-gray-400 shrink-0 hidden sm:block" />
            <select
              className="input-field py-2.5 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              className="input-field py-2.5 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OrgStatus | '')}
            >
              <option value="">ทุกสถานะ</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/50" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูลองค์กร</p>
          <p className="text-sm mt-2 text-gray-500">
            ลองเปลี่ยนตัวกรอง หรือเพิ่มองค์กรใหม่
          </p>
          <Link href="/dashboard/organizations/new" className="btn-primary mt-6 inline-flex">
            <Plus size={16} />
            เพิ่มองค์กรแรก
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {orgs.map((org) => {
            const statusColor = STATUS_COLORS[org.status];
            const catDetails = getCategoryDetails(org.category);
            return (
              <Link href={`/dashboard/organizations/${org.id}`} key={org.id}>
                <div
                  className="glass-card p-4 sm:p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group bg-white/80"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gray-50 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                    {catDetails.icon}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <div>
                      <p className="font-bold text-gray-900 truncate text-base group-hover:text-blue-700 transition-colors">{org.name}</p>
                      <p className="text-sm mt-0.5 font-medium text-gray-500 truncate">
                        {catDetails.label}
                      </p>
                    </div>
                    
                    <div className="hidden md:flex flex-col">
                      {org.province ? (
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" /> {org.province}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                      {org.distance_km && (
                        <span className="text-xs text-gray-500 mt-0.5 ml-5">ห่าง {org.distance_km} กม.</span>
                      )}
                    </div>
                    
                    <div className="hidden md:flex justify-end">
                      <span
                        className="badge shrink-0 border"
                        style={{
                          background: `${statusColor}15`,
                          color: statusColor,
                          borderColor: `${statusColor}30`,
                        }}
                      >
                        {STATUS_LABELS[org.status]}
                      </span>
                    </div>
                  </div>
                  
                  {/* Mobile Status */}
                  <div className="md:hidden shrink-0 flex flex-col items-end gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm border border-white"
                      style={{ background: statusColor }}
                    />
                  </div>

                  <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-50 shrink-0 transition-colors">
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-6 pt-2 gap-4 snap-x hide-scrollbar">
          {ALL_STATUSES.map(status => {
            const columnOrgs = orgs.filter(o => o.status === status);
            const statusColor = STATUS_COLORS[status];
            
            // Hide empty columns if status filter is applied and it doesn't match
            if (filterStatus && filterStatus !== status) return null;
            
            return (
              <div key={status} className="w-[320px] shrink-0 snap-start flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b-[3px] sticky top-0 bg-[#FAFAFA]/90 backdrop-blur-sm z-10" style={{ borderColor: statusColor }}>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor }}></div>
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs font-bold bg-white border shadow-sm px-2 py-0.5 rounded-full text-gray-500">{columnOrgs.length}</span>
                </div>
                
                <div className="flex flex-col gap-3 min-h-[100px]">
                  {columnOrgs.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-medium">
                      ไม่มีรายการ
                    </div>
                  ) : (
                    columnOrgs.map(org => {
                      const catDetails = getCategoryDetails(org.category);
                      return (
                        <Link href={`/dashboard/organizations/${org.id}`} key={org.id} className="block group animate-fade-in">
                          <div className="glass-card p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3 bg-white/90">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{org.name}</p>
                                <p className="text-xs mt-1 font-medium text-gray-500 flex items-center gap-1.5 truncate">
                                  <span className="text-sm leading-none">{catDetails.icon}</span> {catDetails.label}
                                </p>
                              </div>
                            </div>
                            {(org.province || org.distance_km) && (
                              <div className="flex items-center gap-3 pt-2 mt-1 border-t border-gray-100">
                                {org.province && (
                                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                    <MapPin size={12} className="text-gray-400" /> {org.province}
                                  </div>
                                )}
                                {org.distance_km && (
                                  <div className="text-[11px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {org.distance_km} กม.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
