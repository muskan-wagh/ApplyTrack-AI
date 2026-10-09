import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/lib/theme';
import { ApplicationsPage } from '@/pages/Applications';
import { LandingPage } from '@/pages/Landing';
import { OverviewPage } from '@/pages/Overview';
import { ResumeAssistantPage } from '@/pages/ResumeAssistant';
import { ResumeMatchPage } from '@/pages/ResumeMatch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 15_000 },
  },
});

function DashboardRoutes() {
  const [search, setSearch] = useState('');
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppShell onSearch={setSearch} />}>
        <Route index element={<OverviewPage />} />
        <Route path="applications" element={<ApplicationsPage globalSearch={search} />} />
        <Route path="resume-match" element={<ResumeMatchPage />} />
        <Route path="resume-assistant" element={<ResumeAssistantPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <DashboardRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
