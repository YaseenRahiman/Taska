'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: '#fff',
          color: '#363636',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          maxWidth: '400px',
        },
        // Success
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10b981',
          },
        },
        // Error
        error: {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#ef4444',
          },
        },
        // Loading
        loading: {
          style: {
            background: '#f97316',
            color: 'white',
          },
        },
      }}
    />
  );
}
