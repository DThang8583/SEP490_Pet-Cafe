import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './utils/AuthContext'
import SignalRProvider from './utils/SignalRContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SignalRProvider>
      <App />
        </SignalRProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
