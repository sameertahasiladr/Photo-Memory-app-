import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
const theme = createTheme({
  primaryColor: 'teal',
  colors: {
    teal: [
      '#e6fafa',
      '#b3e6e6',
      '#80d2d2',
      '#4dbfbf',
      '#1aabab',
      '#008080',
      '#006666',
      '#004c4c',
      '#003333',
      '#001a1a',
    ],
    deepPurple: [
      '#f2eafa',
      '#d1c4e9',
      '#b39ddb',
      '#9575cd',
      '#7e57c2',
      '#673ab7',
      '#5e35b1',
      '#512da8',
      '#4527a0',
      '#311b92',
    ],
  },
  fontFamily: "'Poppins', sans-serif",
  headings: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
  },
  components: {
    Button: {
      styles: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    Card: {
      styles: {
        root: {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    Paper: {
      styles: {
        root: {
          background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MantineProvider>
  </React.StrictMode>
);