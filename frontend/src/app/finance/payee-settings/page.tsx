import { redirect } from 'next/navigation';

export default function LegacyPayeeSettingsPage() {
  redirect('/settings/receipt-settings');
}
