import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roleConfig';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import backgroundImage from '../assets/images/background.png';
import swachLogo from '../assets/logos/swach.png';
import groupLogo from '../assets/logos/Group-.png';
import minister1 from '../assets/images/minster1.png';
import minister2 from '../assets/images/minister2.png';
import minister3 from '../assets/images/minsiter3.png';
import minister4 from '../assets/images/minister4.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // Call the login API
      const result = await login(username, password, rememberMe);

      if (result?.role === ROLES.SMD) {
        navigate('/dashboard');
      } else if (result?.role === ROLES.CEO) {
        navigate('/dashboard/ceo');
      } else if (result?.role === ROLES.BDO) {
        navigate('/dashboard/bdo');
      } else if (result?.role) {
        navigate(`/dashboard/${result.role}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Full-screen background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.85) 10%, rgba(255, 255, 255, 0.65) 15%, rgba(255, 255, 255, 0.25) 70%, rgba(255, 255, 255, 0) 100%), url(${backgroundImage})`,
          backgroundBlendMode: 'normal',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          margin: 0,
          padding: 0,
          zIndex: -1,
        }}
      ></div>

      {/* Government of India Emblem overlay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}
      >
        <img
          src={groupLogo}
          alt="Government of India"
          style={{
            height: '50px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Ministers Section */}
      <div className="relative top-[120px] left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[800px]">
        {/* White Container for Ministers */}
        <div className="bg-white rounded-xl shadow-lg h-[90px] flex items-end justify-center overflow-visible ">
          <div className="grid grid-cols-4 gap-4 w-full px-4 pb-0 justify-items-center">
            {/* Minister 1 */}
            <div className="flex justify-center items-end">
              <img
                src={minister1}
                alt="Minister 1"
                className="h-[150px] w-auto object-cover"
              />
              
            </div>

            {/* Minister 2 */}
            <div className="flex justify-center items-end">
              <img
                src={minister2}
                alt="Minister 2"
                className="h-[140px] w-auto object-cover"
              />
            </div>

            {/* Minister 3 */}
            <div className="flex justify-center items-end">
              <img
                src={minister3}
                alt="Minister 3"
                className="h-[110px] w-auto object-cover"
              />
            </div>

            {/* Minister 4 */}
            <div className="flex justify-center items-end">
              <img
                src={minister4}
                alt="Minister 4"
                className="h-[110px] w-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Names below the white container */}
        <div className="grid grid-cols-4 gap-20 w-full px-4 pt-12 justify-items-center" style={{ marginTop: '10px' }}>
          {/* Minister 1 Name */}
          <div className="text-center max-w-[150px] justify-self-start ">
            <div className="text-[15px] font-bold text-gray-800">
              श्री नरेंद्र मोदी
            </div>
            <div className="text-[12px] text-gray-500 leading-[1.3]">
              माननीय प्रधानमंत्री-भारत
            </div>
          </div>

          {/* Minister 2 Name */}
          <div className="text-center max-w-[150px]">
            <div className="text-[15px] font-bold text-gray-800">
              श्री भजन लाल शर्मा
            </div>
            <div className="text-[12px] text-gray-500 leading-[1.3]">
              माननीय मुख्यमंत्री-राजस्थान
            </div>
          </div>

          {/* Minister 3 Name */}
          <div className="text-center max-w-[150px]">
            <div className="text-[15px] font-bold text-gray-800">
              श्री मदन दिलावर
            </div>
            <div className="text-[12px] text-gray-500 leading-[1.3]">
              माननीय मंत्री-स्कूल शिक्षा, पंचायती राज एवं संस्कृत शिक्षा विभाग, राजस्थान
            </div>
          </div>

          {/* Minister 4 Name */}
          <div className="text-center max-w-[180px]">
            <div className="text-sm font-bold text-gray-800">
              श्री ओटाराम देवासी
            </div>
            <div className="text-[11px] text-gray-500 leading-[1.3]">
              माननीय राज्य मंत्री-पंचायती राज, ग्रामीण विकास एवं आपदा प्रबंधन, राजस्थान
            </div>
          </div>
        </div>
      </div>

      {/* White dialog box in center */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          minHeight: '500px',
          maxHeight: '90vh',
          zIndex: 9999,
          backgroundColor: 'white',
          background: 'white',
          margin: 0,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto'
        }}
      >
        {/* Swachh Rajasthan Logo */}
        <div style={{ marginBottom: '16px' }}>
          <img
            src={swachLogo}
            alt="Swachh Rajasthan"
            style={{
              height: '70px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Welcome Message */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0 0 0px 0'
          }}>
            Welcome Back!
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#6B7280',
            margin: 0
          }}>
            Restricted access — SMD, CEO, BDO, and VDO roles are enabled.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            marginBottom: '12px',
            color: '#DC2626',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form style={{ width: '100%' }}>
          {/* Username Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}>
                <Mail size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}>
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="remember-me" style={{
                fontSize: '14px',
                color: '#374151'
              }}>
                Remember me
              </label>
            </div>

          </div>

          {/* Login Button */}
          <button
            type="submit"
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#9CA3AF' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>

      {/* White container at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100vw',
          height: '50px',
          zIndex: 9999,
          backgroundColor: 'white',
          background: 'white',
          margin: 0,
          padding: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* Copyright text */}
        <div
          style={{
            color: '#6B7280',
            textAlign: 'center',
            fontFamily: 'Noto Sans',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '24px'
          }}
        >
          © Department of Rural Development & Panchayati Raj, Government of Rajasthan
        </div>
      </div>

    </div>
  );
};

export default Login;

