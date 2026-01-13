import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { SearchPage } from '@/pages/SearchPage';
import { ApplyPage } from '@/pages/ApplyPage';
import { ResumePage } from '@/pages/ResumePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { InterviewPrepPage } from '@/pages/InterviewPrepPage';
import { PricingPage } from '@/pages/PricingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="interview-prep" element={<InterviewPrepPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="pricing" element={<PricingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
