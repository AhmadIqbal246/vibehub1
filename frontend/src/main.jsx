import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import store from './store/store'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.jsx'
import AuthInitializer from './components/common/AuthInitializer'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <App />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </AuthInitializer>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
