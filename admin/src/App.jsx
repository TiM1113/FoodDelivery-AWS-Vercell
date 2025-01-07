import React from 'react'
import Navbar from './components/Navbar/Navbar'// Mount Navbar component into APP.jsx
import Sidebar from './components/Sidebar/Sidebar'// Mount Sidebar component into APP.jsx
import { Routes, Route } from 'react-router-dom'
// automatically import components by setting up routes within Routes
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
// import toasty notification 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Debugging: Log the backend URL to ensure it's being read correctly
console.log(process.env.REACT_APP_API_URL);

const App = () => {

  // Only place const url in App.jsx file instead of placing this variable within different files
  const url = process.env.REACT_APP_API_URL || "http://localhost:4000";

  


  return (
    <div>
      <ToastContainer /> {/* Mount ToastContainer component into APP.jsx */}
      <Navbar /> {/* Mount Navbar component into APP.jsx */}
      <hr />
      <div className="app-content">
        <Sidebar /> {/* Mount Sidebar component into APP.jsx */}

        {/* Import Routes into App.jsx automatically by Routes tag pair */}
        <Routes>
          {/* Set up routes within Routes and Mounted the component-Add/List/Orders  adding url as property in add list and orders pages*/}
          <Route path="/" element={<List url={url}/>} />
          <Route path="/add" element={<Add url={url}/>} /> 
          <Route path="/list" element={<List url={url}/>} />
          <Route path="/orders" element={<Orders url={url}/>} />
        </Routes>
      </div>
    </div>
  )
}

export default App
