import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function ComingSoon({ label = 'Student Wellness' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
      <p className="text-5xl">🚧</p>
      <p className="text-xl font-semibold text-gray-700">{label}</p>
      <p className="text-gray-400">Feature coming soon…</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="*" element={<ComingSoon />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
