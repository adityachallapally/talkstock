// app/dashboard/layout.tsx

import Header from '@/components/header';
import SideNav from '@/components/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <SideNav />
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}