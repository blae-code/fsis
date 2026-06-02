import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerSW } from '@/lib/registerSW'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

registerSW()