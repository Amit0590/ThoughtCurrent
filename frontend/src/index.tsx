import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import MUI Theme components
import CssBaseline from '@mui/material/CssBaseline'; // Import CssBaseline
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import store from './redux/store';
import App from './App';

// Define a basic theme (you can customize this later)
// Let's use a dark theme for now as an example
const theme = createTheme({
  palette: {
    mode: 'dark', // Or 'light'
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}> {/* Wrap with MUI ThemeProvider */}
        <CssBaseline /> {/* Apply baseline styles */}
        <BrowserRouter> {/* Wrap App with BrowserRouter */}
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);