import { DashboardNav } from '@/components/layout/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-paper">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
