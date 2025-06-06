import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './redux/store';
import App from './App';
import { CustomThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <CustomThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CustomThemeProvider>
    </Provider>
  </React.StrictMode>
);