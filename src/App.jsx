import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import DocumentsPage from './pages/DocumentsPage'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/advisor" element={<ComingSoon title="Ask your advisor" icon="ti-message-dots" description="Your AI-powered advisory suite is being built. It will answer sector-specific questions, check job suitability, review your CV, and escalate complex queries to our senior advisor." />} />
            <Route path="/career" element={<ComingSoon title="Career tools" icon="ti-briefcase" description="Job suitability checks, CV and cover letter drafting and review — all personalised to your profile." />} />
            <Route path="/interview" element={<ComingSoon title="Interview preparation" icon="ti-microphone" description="Sector-specific interview questions, personalised coaching tips, and practice sessions grounded in your career history." />} />
            <Route path="/knowledge" element={<ComingSoon title="Knowledge hub" icon="ti-book" description="Curated, browseable knowledge across all humanitarian and development sectors — updated daily and filtered to your expertise." />} />
            <Route path="/tests" element={<ComingSoon title="Knowledge tests" icon="ti-checklist" description="Test and reinforce your sector knowledge with scenario-based questions tailored to your experience level." />} />
            <Route path="/notes" element={<ComingSoon title="AI note taker" icon="ti-notes" description="Upload meeting recordings or transcripts — get structured notes, action points, and leadership-ready reports." />} />
            <Route path="/presentation" element={<ComingSoon title="Presentation builder" icon="ti-presentation" description="Brief the AI on your topic and audience — receive a structured, professional slide deck ready for refinement." />} />
            <Route path="/reports" element={<ComingSoon title="Report drafter" icon="ti-file-text" description="From inputs and briefs to full formatted reports — designed for UN and INGO standards." />} />
            <Route path="/advisor-studio" element={<ComingSoon title="Advisor studio" icon="ti-shield-check" description="Your private workspace for reviewing escalated queries, formulating responses with AI support, and delivering Advisor Notes." />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
