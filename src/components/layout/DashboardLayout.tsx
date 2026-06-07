import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, MobileSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { useIsMobile } from '@/hooks/use-mobile';

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar */}
        {!isMobile && <AppSidebar />}
        
        {/* Mobile sidebar sheet */}
        {isMobile && (
          <MobileSidebar 
            open={mobileMenuOpen} 
            onOpenChange={setMobileMenuOpen} 
          />
        )}
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header 
            showMenuButton={isMobile} 
            onMenuClick={() => setMobileMenuOpen(true)} 
          />
          <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
