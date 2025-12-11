import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { MetadataGodView } from '@/pages/META_02_MetadataGodView';
import { INV01Dashboard } from '@/modules/inventory';
import { SYS01Bootloader } from '@/modules/system';
import PAY01PaymentHubPage from '@/pages/PAY_01_PaymentHubPage';
import { SysConfigProvider } from '@/context/SysConfigContext';
import { Toaster } from 'sonner';

// Wrapper to handle navigation logic
const AppRoutes = () => {
  const navigate = useNavigate();

  const handleTryIt = () => {
    navigate('/dashboard');
  };

  return (
    <Routes>
      {/* PUBLIC ROUTE: The Landing Page */}
      <Route path="/" element={<LandingPage onTryIt={handleTryIt} onCanonClick={handleTryIt} />} />

      {/* SECURE ROUTE: The God View */}
      <Route path="/dashboard" element={<MetadataGodView />} />

      {/* META_02 - Meta Registry (God View) */}
      <Route path="/meta-registry" element={<MetadataGodView />} />

      {/* INV_01 - Inventory Dashboard */}
      <Route path="/inventory" element={<INV01Dashboard />} />

      {/* SYS_01 - System Bootloader */}
      <Route path="/system" element={<SYS01Bootloader />} />
      <Route path="/settings" element={<SYS01Bootloader />} />

      {/* PAY_01 - Payment Hub */}
      <Route path="/payments" element={<PAY01PaymentHubPage />} />
      <Route path="/payment-hub" element={<PAY01PaymentHubPage />} />

      {/* FALLBACK: Redirect unknown paths to Home */}
      <Route path="*" element={<LandingPage onTryIt={handleTryIt} onCanonClick={handleTryIt} />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <SysConfigProvider>
        <div className="antialiased text-nexus-signal bg-nexus-void min-h-screen font-sans selection:bg-nexus-green/30">
          {/* THE CINEMATIC VIGNETTE - Focus the eye to center */}
          <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
          
          <AppRoutes />
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </SysConfigProvider>
    </Router>
  );
}

export default App;
