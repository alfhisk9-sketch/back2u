import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { DevBar } from './components/layout/DevBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { ReportPage } from './pages/ReportPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ModeratorPage } from './pages/ModeratorPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RewardsPage } from './pages/RewardsPage';
import { Button } from './components/ui/Button';

// 404 Not Found Page Component
const NotFoundPage: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-20 text-center">
    <span className="text-4xl font-extrabold text-[#059669]">404</span>
    <h1 className="text-2xl font-bold text-[#12241E] mt-2">Page Not Found</h1>
    <p className="text-xs text-[#536B63] mt-2 leading-relaxed">
      The campus page or item report you were looking for could not be found or has moved.
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <Link to="/">
        <Button variant="outline" size="sm">
          Go Home
        </Button>
      </Link>
      <Link to="/explore">
        <Button variant="primary" size="sm">
          Browse Items
        </Button>
      </Link>
    </div>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#12241E]">
        {/* Top Developer & Evaluator Mode Switcher */}
        <DevBar />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Main Routed Page Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/dashboard" element={<MyReportsPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/moderator" element={<ModeratorPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>


        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
