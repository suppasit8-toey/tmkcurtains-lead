'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type CompletedOrder } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Calendar, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('completed_orders')
        .select('*, organizations(name)')
        .order('completed_date', { ascending: false });
      
      setOrders(data || []);
      setLoading(false);
    }
    fetchOrders();
  }, [supabase]);

  // Calculate totals
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.completed_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const thisMonthAmount = thisMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">งานเสร็จสิ้นทั้งหมด</h1>
          <p className="text-sm mt-1 text-gray-500 font-medium">ประวัติการปิดการขายจากทุกองค์กร</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">ยอดขายรวมทั้งหมด</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">ยอดขายเดือนนี้</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(thisMonthAmount)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">จำนวนงานที่เสร็จสิ้น</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length} <span className="text-sm text-gray-400 font-normal">รายการ</span></p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/50" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-gray-900 font-bold text-lg">ไม่มีรายการงานที่เสร็จสิ้น</p>
          <p className="text-sm mt-1 text-gray-500">คุณสามารถบันทึกงานที่เสร็จสิ้นได้ในหน้ารายละเอียดองค์กร</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">เลขที่คำสั่งซื้อ</th>
                  <th className="px-6 py-4">องค์กร</th>
                  <th className="px-6 py-4">วันที่เสร็จสิ้น</th>
                  <th className="px-6 py-4 text-right">ยอดรวม</th>
                  <th className="px-6 py-4 text-right">ดูข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((o) => {
                  const orgName = (o.organizations as unknown as { name: string })?.name || 'ไม่ระบุ';
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{o.order_number}</td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/organizations/${o.org_id}`} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 whitespace-nowrap">
                          <Building2 size={14} />
                          {orgName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" />{formatDate(o.completed_date)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 whitespace-nowrap">{formatCurrency(o.total_amount || 0)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/organizations/${o.org_id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition-colors">
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
