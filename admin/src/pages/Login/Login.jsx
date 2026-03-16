import { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import './Login.css';

const Login = ({ url, onLoginSuccess }) => {
  const [data, setData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) => {
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/login`, data, { withCredentials: true });
      if (response.data.success) {
        if (response.data.role !== 'admin') {
          setError('This account does not have admin access.');
          await axios.post(`${url}/api/user/logout`, {}, { withCredentials: true });
        } else {
          onLoginSuccess();
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <h2>Admin Panel</h2>
        <p className="admin-login-subtitle">Sign in to continue</p>
        <form onSubmit={onSubmit}>
          <div className="admin-login-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={onChangeHandler}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="admin-login-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={onChangeHandler}
              placeholder="Password"
              required
            />
          </div>
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

Login.propTypes = {
  url: PropTypes.string.isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
};

export default Login;
