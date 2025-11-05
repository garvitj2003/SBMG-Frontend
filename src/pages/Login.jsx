import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roleConfig';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import backgroundImage from '../assets/images/background.png';
import swachLogo from '../assets/logos/swach.png';
import groupLogo from '../assets/logos/Group-.png';
import minister1 from '../assets/images/minister1.png';
import minister2 from '../assets/images/minister2.png';
import minister34 from '../assets/images/minster34.png';
import appStore from '../assets/images/App Store.png';
import googlePlay from '../assets/images/Google Play.png';

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
    <>
      <style>{`
       .login-dialog-responsive {
          margin-bottom: 80px;
        }
           @media (max-width: 768px) {
          .login-dialog-responsive {
            top: 650px !important;
            transform: translateX(-50%) !important;
          }
        }
           @media (min-width: 769px) and (max-width: 1024px) {
          .login-dialog-responsive {
            top: 600px !important;
            transform: translateX(-50%) !important;
          }
        }
           @media (min-width: 1025px) and (max-width: 1366px) {
          .login-dialog-responsive {
            top: 450px !important;
            transform: translateX(-50%) !important;
          }
        }
     
      @media (min-width: 1367px) and (max-width: 1600px) {
          .login-dialog-responsive {
            top: 580px !important;
            transform: translateX(-50%) !important;
          }
        }
        @media (min-width: 1601px) {
          .login-dialog-responsive {
            top: 65% !important;
            transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>
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

       {/* Government Logos Section */}
       <div className="relative flex justify-center items-center gap-4 mb-4 mt-16 flex-wrap" style={{ marginTop: '40px' }}>
          <img src={groupLogo} alt="Government of India" className="h-[40px] w-auto object-contain" />
        </div>


      {/* Ministers Section */}
      <div className="relative top-[50px] left-1/2 -translate-x-1/2 z-[1000] w-[70%] max-w-[900px]">
      
        {/* White Container for Ministers with Central Layout */}
        <div className="relative">
          <div className="bg-white rounded-xl shadow-lg h-[105px] flex items-end justify-center overflow-visible relative">
            {/* Left Side - Ministers 1 & 2 */}
            <div className="absolute left-[-50px] flex items-end">
              {/* Minister 1 */}
              <div className="relative z-10" style={{ bottom: '-20px' }}>
                <img
                  src={minister1}
                  alt="Minister 1"
                  className="h-[200px] w-auto object-cover"
                />
              </div>

              {/* Minister 2 - Overlapping Minister 1 */}
              <div className="relative z-0" style={{ marginLeft: '-180px' }}>
                <img
                  src={minister2}
                  alt="Minister 2"
                  className="h-[180px] w-auto object-cover"
                />
              </div>
            </div>

            {/* Center - Title Text */}
            <div className="absolute left-1/2 text-center z-10" style={{ top: '50%', transform: 'translate(-50%, -50%)' }}>
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1">SBMG Rajasthan</h1>
              <p className="text-sm md:text-xl text-gray-700">स्वच्छ भारत मिशन(ग्रामीण) राजस्थान</p>
            </div>

            {/* Right Side - Ministers 3 & 4 Combined */}
            <div className="absolute right-[0px] flex gap-0 items-end px-2">
              <div className="flex justify-center items-end" style={{ position: 'relative', bottom: '-21px' }}>
                <img
                  src={minister34}
                  alt="Ministers 3 and 4"
                  className="h-[180px] w-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Names below the white container */}
          <div className="flex w-full px-2 pt-12 justify-between" style={{ marginTop: '10px', paddingRight: '40px' }}>
            {/* Left Side Names */}
            <div className="flex gap-5" style={{ paddingLeft: '40px' }}>
              {/* Minister 1 Name */}
              <div className="text-center max-w-[150px] -mr-4">
                <div className="text-[13px] font-bold text-gray-800">
                  श्री नरेंद्र मोदी
                </div>
                <div className="text-[12px]  text-gray-500 leading-[1.3]">
                  माननीय प्रधानमंत्री-भारत
                </div>
              </div>

              {/* Minister 2 Name */}
              <div className="text-center max-w-[150px] -mr-4">
                <div className="text-[13px] font-bold text-gray-800">
                  श्री भजन लाल शर्मा
                </div>
                <div className="text-[12px]  text-gray-500 leading-[1.3]">
                  माननीय मुख्यमंत्री-राजस्थान
                </div>
              </div>
            </div>

            {/* Right Side Names */}
            <div className="flex gap-5" style={{ marginRight: '-70px' }}>
              {/* Minister 3 Name */}
              <div className="text-center max-w-[180px] -mr-4">
              <div className="text-[13px] font-bold text-gray-800">
                    श्री मदन दिलावर
                  </div>
                  <div className="text-[11px]  text-gray-500 leading-tight" style={{ lineHeight: '1.15' }}>
                    माननीय मंत्री-स्कूल शिक्षा, पंचायती राज एवं संस्कृत शिक्षा विभाग, राजस्थान
                  </div>
                </div>

                {/* Minister 4 Name */}
                <div className="text-center max-w-[180px] -mr-4">
                <div className="text-[13px] font-bold text-gray-800">
                    श्री ओटाराम देवासी
                  </div>
                  <div className="text-[11px] text-gray-500 leading-tight" style={{ lineHeight: '1.15' }}>
                    माननीय राज्य मंत्री-पंचायती राज, ग्रामीण विकास एवं आपदा प्रबंधन, राजस्थान
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White dialog box in center */}
      <div
        className="login-dialog-responsive absolute left-1/2 w-[90%] max-w-[450px] min-h-[500px] z-[9999] bg-white flex flex-col items-center rounded-xl shadow-lg overflow-y-auto"
        style={{
          padding: '32px',
          paddingBottom: '50px',
          maxHeight: '90vh',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
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
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0 0 0px 0'
          }}>
            पंचायतीराज विभाग, राजस्थान
          </h1>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0 0 0px 0'
          }}>
            Welcome
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#6B7280',
            margin: 0,
            fontWeight: 'bold'
          }}>
            For authorise personal - SMD, CEO, BDO & VDO only.
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
          {/* Email Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              Email
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
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your official email"
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
              opacity: isLoading ? 0.7 : 1,
              marginBottom: '16px'
            }}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        {/* App Store Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '10px',
          marginBottom: '16px'
        }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'block',
              cursor: 'pointer'
            }}
          >
            <img
              src={googlePlay}
              alt="Get it on Google Play"
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'block',
              cursor: 'pointer'
            }}
          >
            <img
              src={appStore}
              alt="Download on the App Store"
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </a>
        </div>

        {/* Complaint Contact Banner */}
        <div style={{
          width: '100%',
          backgroundColor: '#FFF7ED',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center',
          marginTop: '10px',
          marginBottom: '40px'
        }}>
          <p style={{
            color: '#C2410C',
            fontSize: '14px',
            fontWeight: '500',
            margin: 0
          }}>
            Call us at 0141-2204880 for any complaint
          </p>
        </div>
      </div>

      {/* White container at bottom */}
      <div
        style={{
          position: 'fixed',
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
    </>
  );
};

export default Login;
