import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Login from './pages/Login/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '@food-delivery/shared';

const App = () => {
  const apiUrl = import.meta.env.VITE_API_URL || API_BASE_URL;
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  if (!isAdminAuth) {
    return (
      <>
        <ToastContainer />
        <Login url={apiUrl} onLoginSuccess={() => setIsAdminAuth(true)} />
      </>
    );
  }

  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<List url={apiUrl} />} />
          <Route path="/add" element={<Add url={apiUrl} />} />
          <Route path="/list" element={<List url={apiUrl} />} />
          <Route path="/orders" element={<Orders url={apiUrl} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
