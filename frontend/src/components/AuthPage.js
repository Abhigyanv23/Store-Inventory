import React, { useState } from 'react';
import axios from 'axios'; // We use raw axios here since it's not a *secured* route
import { Package, LogIn, UserPlus } from 'lucide-react';
import './AuthPage.css';

const API_URL = 'http://localhost:5000/api';

function AuthPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const url = isRegistering 
      ? `${API_URL}/auth/register` 
      : `${API_URL}/auth/login`;

    try {
      if (isRegistering) {
        // --- REGISTER ---
        await axios.post(url, { username, password });
        setSuccess('Registration successful! Please log in.');
        setIsRegistering(false); // Flip back to login
        setUsername('');
        setPassword('');
      } else {
        // --- LOGIN ---
        const res = await axios.post(url, { username, password });
        // onLogin is passed from App.js
        // It saves the token and user data
        onLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <Package className="icon" />
        <h2>Inventory Management</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h3>{isRegistering ? 'Register' : 'Login'}</h3>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : (
              isRegistering ? <><UserPlus size={18} /> Register</> : <><LogIn size={18} /> Login</>
            )}
          </button>
        </form>
        
        <button 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError(null);
            setSuccess(null);
          }} 
          className="btn-toggle-auth"
          disabled={isLoading}
        >
          {isRegistering ? 'Already have an account? Login' : "Need an account? Register"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
