'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Quotation } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { FileText, ExternalLink, Calendar, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchQuotations() {
      const { data } = await supabase
        .from('quotations')
        .select('*, organizations(name)')
        .order('date_sent', { ascending: false });
      
      setQuotations(data || []);
      setLoading(false);
    }
    fetchQuotations();
  }, [supabase]);

  // Calculate totals
  const totalAmount = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const approvedCount = quotations.filter(q => q.status === 'approved').length;
  const pendingCount = quotations.filter(q => q.status === 'pending').length;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบเสนอราคาทั้งหมด</h1>
          <p className="text-sm mt-1 text-gray-500 font-medium">ประวัติการเสนอราคาทุกองค์กร</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">ยอดรวมทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">อนุมัติแล้ว</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount} <span className="text-sm text-gray-400 font-normal">รายการ</span></p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-gray-500">รอพิจารณา</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pendingCount} <span className="text-sm text-gray-400 font-normal">รายการ</span></p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/50" />
          ))}
        </div>
      ) : quotations.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <FileText size={24} />
          </div>
          <p className="text-gray-900 font-bold text-lg">ไม่มีใบเสนอราคา</p>
          <p className="text-sm mt-1 text-gray-500">ใบเสนอราคาจะแสดงที่นี่เมื่อคุณเพิ่มในหน้ารายละเอียดองค์กร</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">เลขที่ใบเสนอ</th>
                  <th className="px-6 py-4">องค์กร</th>
                  <th className="px-6 py-4">วันที่ส่ง</th>
                  <th className="px-6 py-4">ยอดรวม</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-right">ดูข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {quotations.map((q) => {
                  const orgName = (q.organizations as unknown as { name: string })?.name || 'ไม่ระบุ';
                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{q.quote_number}</td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/organizations/${q.org_id}`} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 whitespace-nowrap">
                          <Building2 size={14} />
                          {orgName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" />{formatDate(q.date_sent)}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{formatCurrency(q.total_amount || 0)}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="badge text-[11px] border" style={{
                          background: q.status === 'approved' ? '#ECFDF5' : q.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                          color: q.status === 'approved' ? '#059669' : q.status === 'rejected' ? '#DC2626' : '#D97706',
                          borderColor: q.status === 'approved' ? '#A7F3D0' : q.status === 'rejected' ? '#FECACA' : '#FDE68A',
                        }}>
                          {q.status === 'approved' ? 'อนุมัติแล้ว' : q.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/organizations/${q.org_id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition-colors">
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
