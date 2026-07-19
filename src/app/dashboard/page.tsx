import { createClient } from '@/lib/supabase/server';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import type { OrgStatus, OrgCategoryData } from '@/lib/types';
import Link from 'next/link';
import { Building2, TrendingUp, FileText, CheckCircle2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [orgsRes, convRes, catRes] = await Promise.all([
    supabase.from('organizations').select('id, status, category, name, updated_at'),
    supabase.from('conversation_history')
      .select('id, date, summary, org_id, organizations(name)')
      .order('date', { ascending: false })
      .limit(5),
    supabase.from('org_categories').select('*')
  ]);

  const orgs = orgsRes.data;
  const conversations = convRes.data;
  const categories: OrgCategoryData[] = catRes.data || [];

  // Count by status
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  orgs?.forEach((org) => {
    statusCounts[org.status] = (statusCounts[org.status] || 0) + 1;
    categoryCounts[org.category] = (categoryCounts[org.category] || 0) + 1;
  });

  const totalOrgs = orgs?.length || 0;
  const wonOrgs = statusCounts['won'] || 0;
  const activeOrgs = totalOrgs - (statusCounts['won'] || 0) - (statusCounts['lost'] || 0);

  const statuses: OrgStatus[] = [
    'new_lead', 'contacted', 'presented', 'quoted', 'negotiating', 'won', 'lost', 'on_hold',
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm mt-1 text-gray-500">
            ภาพรวมระบบ LEAD Management
          </p>
        </div>
        <Link href="/dashboard/organizations/new" className="btn-primary shadow-sm">
          <Plus size={16} />
          เพิ่มองค์กร
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={<Building2 size={22} />}
          label="องค์กรทั้งหมด"
          value={totalOrgs}
          color="#3B82F6"
        />
        <SummaryCard
          icon={<TrendingUp size={22} />}
          label="กำลังดำเนินการ"
          value={activeOrgs}
          color="#06B6D4"
        />
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          label="ปิดการขายสำเร็จ"
          value={wonOrgs}
          color="#10B981"
        />
        <SummaryCard
          icon={<FileText size={22} />}
          label="หมวดหมู่"
          value={Object.keys(categoryCounts).length}
          color="#F59E0B"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="md:col-span-2 glass-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">สถานะ LEAD</h2>
          <div className="flex flex-col gap-4">
            {statuses.map((status) => {
              const count = statusCounts[status] || 0;
              const pct = totalOrgs > 0 ? (count / totalOrgs) * 100 : 0;
              const color = STATUS_COLORS[status];
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-600 font-medium shrink-0">
                    {STATUS_LABELS[status]}
                  </div>
                  <div className="flex-1 rounded-full h-3 bg-gray-100 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <div className="w-8 text-sm text-right font-bold text-gray-900 shrink-0">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">หมวดหมู่</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const catData = categories.find(c => c.value === cat) || { label: cat, icon: '🏢' };
                return (
                <div key={cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <span className="text-lg bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">{catData.icon}</span>
                    <span className="truncate max-w-32">{catData.label}</span>
                  </div>
                  <span
                    className="badge bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2.5 py-0.5"
                  >
                    {count}
                  </span>
                </div>
              )})}
            {Object.keys(categoryCounts).length === 0 && (
              <p className="text-sm text-center py-8 text-gray-400">
                ยังไม่มีข้อมูล
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">การพูดคุยล่าสุด</h2>
        </div>
        {conversations && conversations.length > 0 ? (
          <div className="flex flex-col gap-3">
            {conversations.map((conv) => {
              const org = conv.organizations as unknown as { name: string } | null;
              return (
                <div
                  key={conv.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-blue-500 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {org?.name || 'ไม่ระบุ'}
                    </p>
                    <p className="text-sm mt-1 text-gray-600 line-clamp-2">
                      {conv.summary}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-400 shrink-0 bg-white px-2 py-1 rounded-md border border-gray-100">
                    {new Intl.DateTimeFormat('th-TH', { month: 'short', day: 'numeric' }).format(
                      new Date(conv.date)
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center py-8 text-gray-400">
            ยังไม่มีประวัติการพูดคุย
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 -mr-8 -mt-8"
        style={{ background: color }}
      />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center relative z-10"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm mt-1 font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}
