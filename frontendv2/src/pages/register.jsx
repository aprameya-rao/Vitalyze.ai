import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { authService } from '../services/api'; 
import '../App.css'; 

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    password: ''
  });
  const [phone, setPhone] = useState(''); // PhoneInput handles state separately
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!phone || !formData.password || !formData.name) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      // Backend expects 'phone_number' and 'age' as integer
      const payload = {
        name: formData.name,
        phone_number: phone, // PhoneInput returns format like "+919999999999"
        password: formData.password,
        age: parseInt(formData.age) || null,
        gender: formData.gender
      };

      await authService.register(payload);
      
      alert('Registration Successful! Please Sign In.');
      navigate('/signin');
      
    } catch (err) {
      console.error("Registration Error:", err);
      // Try to extract backend error message
      const msg = err.response?.data?.detail || 'Registration failed. Try again.';
      setError(msg);
    }
  };

  return (
    <div className="signin-container">
      <h2>Create an Account</h2>
      {error && <p className="error-msg">{error}</p>}
      
      <form onSubmit={handleSubmit} className="details-form">
        <label>Full Name</label>
        <input 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          className="details-input" 
          required 
        />

        <label>Phone Number</label>
        <PhoneInput
          international
          defaultCountry="IN"
          value={phone}
          onChange={setPhone}
          className="phone-input-custom"
        />

        <label>Password (Min 8 chars)</label>
        <input 
          type="password" 
          name="password" 
          value={formData.password} 
          onChange={handleChange} 
          className="details-input" 
          minLength={8}
          required 
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label>Age</label>
            <input 
              type="number" 
              name="age" 
              value={formData.age} 
              onChange={handleChange} 
              className="details-input" 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              className="details-input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: 20 }}>
          Register
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </div>
  );
}

export default RegisterPage;