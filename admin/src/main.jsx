import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Import BrowserRouter from "react-router-dom"
import {BrowserRouter} from "react-router-dom"

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
