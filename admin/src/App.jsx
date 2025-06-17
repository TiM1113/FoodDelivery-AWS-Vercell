import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  // Get the base URL for API calls
  const apiUrl = import.meta.env.VITE_API_URL || "https://backend-ten-azure-58.vercel.app";
  
  // Log the URL for debugging
  console.log('API URL:', apiUrl);

  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<List url={apiUrl}/>} />
          <Route path="/add" element={<Add url={apiUrl}/>} /> 
          <Route path="/list" element={<List url={apiUrl}/>} />
          <Route path="/orders" element={<Orders url={apiUrl}/>} />
        </Routes>
      </div>
    </div>
  )
}

export default App
