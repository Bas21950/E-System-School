'use client';

import { useEffect, useState } from 'react';
import type { UpdateState } from '@/types/electron';

const initialState: UpdateState = { phase: 'idle' };

function cleanReleaseNote(note: string) {
  return note.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function UpdateOverlay() {
  const [state, setState] = useState<UpdateState>(initialState);
  const [retrying, setRetrying] = useState(false);

  const isComplete = state.phase === 'downloaded';
  const isFailed = state.phase === 'error' && Boolean(state.version);
  const isBlocking = ['available', 'progress', 'downloaded'].includes(state.phase) || isFailed;

  useEffect(() => {
    const appShell = document.getElementById('app-shell');
    if (appShell) {
      appShell.inert = isBlocking;
      if (isBlocking) appShell.setAttribute('aria-hidden', 'true');
      else appShell.removeAttribute('aria-hidden');
    }
    return () => {
      if (appShell) {
        appShell.inert = false;
        appShell.removeAttribute('aria-hidden');
      }
    };
  }, [isBlocking]);

  useEffect(() => {
    if (!window.electron) return;

    let active = true;
    const applyState = (next: UpdateState) => {
      if (active) setState((current) => ({ ...current, ...next }));
    };
    const startDownload = () => {
      void window.electron?.downloadUpdate().catch(() => undefined);
    };

    void window.electron.getUpdateState().then(applyState).catch(() => undefined);
    const unsubscribe = [
      window.electron.onUpdate('update:idle', (payload) => applyState({ ...payload, phase: 'idle' })),
      window.electron.onUpdate('update:available', (payload) => {
        applyState({ ...payload, phase: 'available' });
        startDownload();
      }),
      window.electron.onUpdate('update:progress', (payload) => applyState({ ...payload, phase: 'progress' })),
      window.electron.onUpdate('update:downloaded', (payload) => applyState({ ...payload, phase: 'downloaded' })),
      window.electron.onUpdate('update:error', (payload) => applyState({ ...payload, phase: 'error' })),
    ];

    return () => {
      active = false;
      unsubscribe.forEach((remove) => remove());
    };
  }, []);

  if (!isBlocking) return null;

  const progress = Math.max(0, Math.min(100, state.percent ?? 0));
  const notes = (state.releaseNotes || []).map(cleanReleaseNote).filter(Boolean);
  const retryDownload = async () => {
    if (!window.electron) return;
    setRetrying(true);
    try {
      await window.electron.downloadUpdate();
    } catch {
      setRetrying(false);
    }
  };

  return (
    <section
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-title"
      aria-describedby="update-description"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-sky-200 bg-white shadow-xl">
        <div className="border-b border-sky-100 bg-sky-700 px-6 py-5 text-white">
          <p className="text-sm font-semibold">E-System School</p>
          <h2 id="update-title" className="mt-1 text-balance text-2xl font-bold">
            {isComplete ? 'ดาวน์โหลดเสร็จ กำลังติดตั้งและเปิดโปรแกรมใหม่' : isFailed ? 'ดาวน์โหลดอัปเดตไม่สำเร็จ' : 'กำลังอัปเดตโปรแกรม'}
          </h2>
          {state.version && (
            <p className="mt-1 text-sm text-sky-100">
              เวอร์ชัน {state.currentVersion || 'ปัจจุบัน'} → {state.version}
            </p>
          )}
        </div>

        <div className="space-y-5 px-6 py-6">
          <p id="update-description" className="text-pretty text-base leading-7 text-slate-700">
            {isComplete
              ? 'กำลังปิดโปรแกรมเพื่อติดตั้งเวอร์ชันใหม่และจะเปิดโปรแกรมให้อัตโนมัติ กรุณารอสักครู่'
              : isFailed
                ? `ระบบล็อกการใช้งานไว้จนกว่าอัปเดตเวอร์ชัน ${state.version} จะเสร็จ ข้อมูลที่บันทึกไว้จะไม่ถูกลบ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง${state.message ? ` (${state.message})` : ''}`
                : 'โปรดรอระหว่างระบบดาวน์โหลดและติดตั้งอัปเดต หน้าจอนี้ล็อกการใช้งานไว้เพื่อป้องกันข้อมูลสูญหาย ข้อมูลนักเรียน การเงิน และไฟล์ใน Data/Receipts จะถูกเก็บไว้'}
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-balance text-sm font-bold text-slate-900">รายการที่อัปเดต</h3>
              {notes.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-pretty text-sm leading-6 text-slate-700">
                  {notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-amber-800">เวอร์ชันนี้ไม่มีรายการเปลี่ยนแปลงแนบมา กรุณาติดต่อผู้ดูแลระบบก่อนดำเนินการ</p>
              )}
          </div>

          {isFailed && (
            <button type="button" onClick={() => void retryDownload()} disabled={retrying} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">
              {retrying ? 'กำลังเชื่อมต่อเพื่อดาวน์โหลด…' : 'ลองดาวน์โหลดอัปเดตอีกครั้ง'}
            </button>
          )}

          {!isComplete && !isFailed && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>กำลังดาวน์โหลดไฟล์อัปเดต</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <div className="h-full bg-sky-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
