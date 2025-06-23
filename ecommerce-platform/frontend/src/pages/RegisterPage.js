import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'buyer', // Default role
    firstName: '',
    lastName: '',
    // phoneNumber: '', // Example for future
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register: registerContext } = useAuth(); // Get register function from context

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!formData.username || !formData.email || !formData.password || !formData.role) {
        setError('Please fill in all required fields: Username, Email, Password, Role.');
        setLoading(false);
        return;
    }

    try {
      const registrationData = { ...formData };
      // Backend expects passwordConfirm, so no need to delete it before sending
      // delete registrationData.passwordConfirm;

      const backendResponse = await authService.register(registrationData);

      // The authService.register now returns { user, token }
      // Update context with this data
      registerContext({ user: backendResponse.user, token: backendResponse.token });

      navigate('/'); // Redirect to home or dashboard
    } catch (err) {
      // err.message is now the error from authService
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="password">Password (min 6 chars):</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
        </div>
        <div>
          <label htmlFor="passwordConfirm">Confirm Password:</label>
          <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="role">Register as:</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </div>
        <div>
          <label htmlFor="firstName">First Name (Optional):</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="lastName">Last Name (Optional):</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
        </div>
        {/* <div>
          <label htmlFor="phoneNumber">Phone Number (Optional):</label>
          <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
        </div> */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default RegisterPage;
