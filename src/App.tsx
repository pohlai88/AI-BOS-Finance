import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { MetadataGodView } from '@/components/metadata/pages/MetadataGodView';
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
          <AppRoutes />
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </SysConfigProvider>
    </Router>
  );
}

export default App;
