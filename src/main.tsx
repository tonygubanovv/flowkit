import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppEntry } from './components/AppEntry'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<AppEntry />)
}