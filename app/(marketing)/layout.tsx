import { MarketingNav } from '@/components/layout/MarketingNav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-paper">
      <MarketingNav />
      {children}
    </div>
  );
}
