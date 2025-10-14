import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { PasswordList } from './components/PasswordList';
import { AdvancedPasswordForm } from './components/AdvancedPasswordForm';
import { PasswordGenerator } from './components/PasswordGenerator';

function MainApp() {
  const { isAuthenticated, editingPassword, showPasswordGenerator } = useApp();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-dark-900 flex transition-colors duration-200">
      <Sidebar />
      <PasswordList />
      
      {editingPassword !== null && <AdvancedPasswordForm />}
      {showPasswordGenerator && <PasswordGenerator />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;