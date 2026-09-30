'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HiOutlineBanknotes, HiOutlinePrinter, HiOutlineArrowDownTray } from 'react-icons/hi2';
import type { Student } from '../types/student';
import { buildApiUrl } from '@/lib/api';

interface StudentDetailProps { student: Student; onClose: () => void }

export default function StudentDetail({ student }: StudentDetailProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    setHtml(''); setError(''); setReady(false);
    fetch(buildApiUrl(`/students/${encodeURIComponent(student.id)}/document`), { signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw new Error('ไม่สามารถโหลดเอกสารนักเรียนได้');
        setHtml(await response.text());
      }).catch(err => { if (!abort.signal.aborted) setError(err.message); });
    return () => abort.abort();
  }, [student.id]);

  async function exportPdf() {
    setExporting(true); setError('');
    try {
      const response = await fetch(buildApiUrl(`/students/${encodeURIComponent(student.id)}/document.pdf`));
      if (!response.ok) throw new Error('สร้าง PDF ไม่สำเร็จ กรุณาลองอีกครั้ง');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `ประวัตินักเรียน-${student.student_id || student.id}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err instanceof Error ? err.message : 'สร้าง PDF ไม่สำเร็จ'); }
    finally { setExporting(false); }
  }

  return <div className="space-y-4">
    <div className="student-detail-actions flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-gray-600">แบบฟอร์มตามต้นฉบับ · A4 หน้าเดียว · TH Sarabun PSK</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={!ready} onClick={() => frame.current?.contentWindow?.print()}>
          <HiOutlinePrinter size={18}/> พิมพ์เอกสาร
        </button>
        <button type="button" className="btn-secondary" disabled={!ready || exporting} onClick={exportPdf}>
          <HiOutlineArrowDownTray size={18}/> {exporting ? 'กำลังสร้าง PDF…' : 'ดาวน์โหลด PDF'}
        </button>
        <Link href={`/finance/student-payments/${student.id}`} className="btn-primary"><HiOutlineBanknotes size={18}/> ข้อมูลการเงิน</Link>
      </div>
    </div>
    {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!html && !error && <p role="status" className="py-8 text-center">กำลังโหลดเอกสาร…</p>}
    {html && <iframe ref={frame} title="เอกสารประวัตินักเรียน A4" srcDoc={html}
      className="w-full rounded border border-gray-300 bg-gray-100" style={{ height: 'min(75vh, 1150px)', minHeight: 480 }}
      onLoad={async () => {
        const current = frame.current?.contentWindow as (Window & { documentReady?: Promise<void> }) | null;
        if (current) { await current.documentReady; setReady(true); }
      }}/>
    }
  </div>;
}
