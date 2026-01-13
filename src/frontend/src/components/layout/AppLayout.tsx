import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ActionRecorder } from '@/components/features/ActionRecorder';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Floating Action Recorder - Always available for reverse engineering */}
      <ActionRecorder />
    </div>
  );
}
