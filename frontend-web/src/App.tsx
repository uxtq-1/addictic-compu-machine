import React from 'react';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';

// TODO: Implement proper routing with react-router
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const handleLogin = (email: string, password: string) => {
    // TODO: Integrate with Firebase Auth
    console.log('Login attempt:', email);
    setIsLoggedIn(true);
  };

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
