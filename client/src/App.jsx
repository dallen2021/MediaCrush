import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import CompressPage from './pages/CompressPage/CompressPage';
import ConvertPage from './pages/ConvertPage/ConvertPage';
import ErrorToast from './components/ErrorToast/ErrorToast';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/compress" replace />} />
          <Route path="/compress" element={<CompressPage />} />
          <Route path="/convert" element={<ConvertPage />} />
        </Routes>
      </main>
      <ErrorToast />
    </div>
  );
}
