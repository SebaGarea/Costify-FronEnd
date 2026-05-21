import { createRoot } from 'react-dom/client'
import { ColorModeScript } from '@chakra-ui/react'
import App from './App.jsx'
import theme from './theme'

createRoot(document.getElementById('root')).render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </>,
)
