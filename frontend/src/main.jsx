import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'
import './style.css'
import './auth.css'

const isAdminPage = window.location.pathname.replace(/\/+$/, '') === '/admin'
createRoot(document.getElementById('root')).render(<React.StrictMode>{isAdminPage ? <AdminApp /> : <App />}</React.StrictMode>)
