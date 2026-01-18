import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import appStore from '../assets/images/App Store.png';
import backgroundImage from '../assets/images/background.png';
import googlePlay from '../assets/images/Google Play.png';
import minister1 from '../assets/images/minister1.png';
import minister2 from '../assets/images/minister2.png';
import minister34 from '../assets/images/minster34.png';
import groupLogo from '../assets/logos/Group-.png';
import swachLogo from '../assets/logos/swach.png';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roleConfig';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1025;
    }
    return false;
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check screen size to conditionally render ministers section
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const shouldShow = width > 1024; // Show only if width is greater than 1024px
      setIsLargeScreen(shouldShow);
      console.log('Screen width:', width, 'Show ministers:', shouldShow);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
       .login-dialog-responsive {
          margin-bottom: 0;
        }
        /* Default: Hide ministers section completely */
        .login-ministers-section {
          display: none !important;
          visibility: hidden !important;
        }
        /* Show only on large screens (1025px and above) */
        @media (min-width: 1025px) {
          .login-ministers-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }
        /* Extra aggressive hiding for ALL small screens */
        @media screen and (max-width: 1024px) {
          .login-ministers-section {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            pointer-events: none !important;
            transform: scale(0) !important;
            z-index: -9999 !important;
          }
          .login-ministers-section * {
            display: none !important;
            visibility: hidden !important;
          }
          .login-dialog-responsive {
            top: auto !important;
            bottom: 50px !important;
            transform: translateX(-50%) !important;
            width: 95% !important;
            max-width: 500px !important;
            max-height: none !important;
            height: auto !important;
            overflow-y: visible !important;
            padding: 20px !important;
            padding-bottom: 30px !important;
          }
          .login-logo-section {
            margin-top: 10px !important;
            margin-bottom: 10px !important;
          }
        }
        @media (min-width: 1025px) {
          .login-ministers-section {
            z-index: 100 !important;
            margin-bottom: 20px !important;
          }
          .login-dialog-responsive {
            z-index: 1000 !important;
          }
        }
        @media (min-width: 1025px) and (max-width: 1366px) {
          .login-dialog-responsive {
            top: 70% !important;
            transform: translate(-50%, -50%) !important;
            max-height: 65vh !important;
            max-width: 380px !important;
            padding: 20px !important;
            padding-bottom: 25px !important;
          }
        }
           /* => change top postion 68% to 66% */
        @media (min-width: 1367px) and (max-width: 1600px) {
          .login-dialog-responsive {
            top: 66% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 400px !important;
            padding: 24px !important;
            padding-bottom: 38px !important;
           
          }
        }
        @media (min-width: 1601px) {
          .login-dialog-responsive {
            top: 65% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 420px !important;
            padding: 28px !important;
            padding-bottom: 32px !important;
          }
        }
      `}</style>
      <div className="h-screen w-full relative  ">
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
        {/*  change margin top 40px to 20px */}
        <div className="login-logo-section relative flex justify-center items-center gap-2 md:gap-4 mb-2 md:mb-4 mt-2 md:mt-4 flex-wrap" style={{ marginTop: '20px' }}>
          <img src={groupLogo} alt="Government of India" className="h-[30px] md:h-[40px] w-auto object-contain" />
        </div>


        {/* Ministers Section - Only render on large screens (width > 1024px) */}
        {/* change top location */}
        {isLargeScreen ? (
          <div className="login-ministers-section relative top-[10px] md:top-[5px] lg:top-[10px] xl:top-[15px] left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-[80%] lg:w-[70%] max-w-[900px]">

            {/* White Container for Ministers with Central Layout */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg h-[60px] md:h-[80px] lg:h-[105px] flex items-end justify-center overflow-visible relative">
                {/* Left Side - Ministers 1 & 2 */}
                <div className="absolute left-[-30px] md:left-[-40px] lg:left-[-50px] flex items-end">
                  {/* Minister 1 */}
                  <div className="relative z-10" style={{ bottom: '-20px' }}>
                    <img
                      src={minister1}
                      alt="Minister 1"
                      className="h-[80px] md:h-[120px] lg:h-[200px] w-auto object-cover"
                    />
                  </div>

                  {/* Minister 2 - Overlapping Minister 1 */}
                  <div className="relative z-0" style={{ marginLeft: '-190px' }}>
                    <img
                      src={minister2}
                      alt="Minister 2"
                      className="h-[70px] md:h-[110px] lg:h-[180px] w-auto object-cover"
                    />
                  </div>
                </div>

                {/* Center - Title Text */}
                <div className="absolute left-1/2 text-center z-10" style={{ top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <h1 className="text-sm md:text-lg lg:text-2xl font-bold text-gray-800 mb-0 md:mb-1">स्वच्छ भारत मिशन(ग्रामीण)</h1>
                  <p className="text-xs md:text-base lg:text-xl font-bold text-gray-800"> राजस्थान</p>
                </div>

                {/* Right Side - Ministers 3 & 4 Combined */}
                <div className="absolute right-[-10px] md:right-[-5px] lg:right-[0px] flex gap-0 items-end px-1 md:px-2">
                  <div className="flex justify-center items-end" style={{ position: 'relative', bottom: '-20px' }}>
                    <img
                      src={minister34}
                      alt="Ministers 3 and 4"
                      className="h-[70px] md:h-[110px] lg:h-[180px] w-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Names below the white container - Hidden on small screens */}
              <div className="hidden md:flex w-full px-2 pt-6 lg:pt-12 justify-between flex-wrap md:flex-nowrap" style={{ marginTop: '5px', paddingRight: '40px' }}>
                {/* Left Side Names */}
                <div className="flex gap-2 md:gap-5 flex-wrap md:flex-nowrap" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                  {/* Minister 1 Name */}
                  <div className="text-center max-w-[150px] -mr-4">
                    <div className="text-[11px] md:text-[13px] font-bold text-gray-800">
                      श्री नरेंद्र मोदी
                    </div>
                    <div className="text-[10px] md:text-[12px] text-gray-500 leading-[1.3]">
                      माननीय प्रधानमंत्री
                    </div>
                  </div>

                  {/* Minister 2 Name */}
                  <div className="text-center max-w-[150px] -mr-4">
                    <div className="text-[11px] md:text-[13px] font-bold text-gray-800">
                      श्री भजन लाल शर्मा
                    </div>
                    <div className="text-[10px] md:text-[12px] text-gray-500 leading-[1.3]">
                      माननीय मुख्यमंत्री-राजस्थान सरकार
                    </div>
                  </div>
                </div>

                {/* Right Side Names */}
                <div className="flex gap-2 md:gap-5 flex-wrap md:flex-nowrap" style={{ marginRight: '-70px', marginTop: '10px', marginBottom: '10px' }}>
                  {/* Minister 3 Name */}
                  <div className="text-center max-w-[180px] -mr-4">
                    <div className="text-[11px] md:text-[13px] font-bold text-gray-800">
                      श्री मदन दिलावर
                    </div>
                    <div className="text-[9px] md:text-[11px] text-gray-500 leading-tight" style={{ lineHeight: '1.15' }}>
                      माननीय मंत्री-स्कूल शिक्षा, पंचायती राज एवं संस्कृत शिक्षा विभाग, राजस्थान
                    </div>
                  </div>

                  {/* Minister 4 Name */}
                  <div className="text-center max-w-[180px] -mr-4">
                    <div className="text-[11px] md:text-[13px] font-bold text-gray-800">
                      श्री ओटाराम देवासी
                    </div>
                    <div className="text-[9px] md:text-[11px] text-gray-500 leading-tight" style={{ lineHeight: '1.15' }}>
                      माननीय राज्य मंत्री-पंचायती राज, ग्रामीण विकास एवं आपदा प्रबंधन, राजस्थान
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* White dialog box in center */}
        <div
          className="login-dialog-responsive absolute left-1/2  w-[90%] max-w-[450px] z-[1000] bg-white flex flex-col items-center rounded-xl shadow-lg overflow-y-auto"
          style={{
            padding: '32px',
            paddingBottom: '50px',
            maxHeight: '90vh',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Swachh Rajasthan Logo */}
          <div className="hidden lg:block" style={{ marginBottom: '8px' }}>
            <img
              src={swachLogo}
              alt="Swachh Rajasthan"
              className="h-10 md:h-12 lg:h-14 xl:h-16 w-auto object-contain"
              style={{
                height: '70px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Welcome Message */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <h1 className="text-sm md:text-base lg:text-lg xl:text-xl" style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1F2937',
              margin: '0 0 0px 0'
            }}>
              पंचायतीराज विभाग, राजस्थान
            </h1>
            <h2 className="text-xs md:text-sm lg:text-base" style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1F2937',
              margin: '0 0 0px 0'
            }}>
              Welcome
            </h2>
            <p className="text-[10px] md:text-xs lg:text-sm hidden lg:block" style={{
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
            <div style={{ marginBottom: '4px' }}>
              <label className="text-xs md:text-sm" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px',
                textAlign: 'left'
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your official email"
                  className="text-xs md:text-sm lg:text-sm"
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 36px',
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
            <div style={{ marginBottom: '8px' }}>
              <label className="text-xs md:text-sm" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px',
                textAlign: 'left'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="text-xs md:text-sm lg:text-sm"
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 36px',
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
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="remember-me" className="text-xs md:text-sm" style={{
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
              className="text-sm md:text-base"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: isLoading ? '#9CA3AF' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                marginBottom: '12px'
              }}
            >
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* App Store Buttons - Hidden on large screens to save space */}
          <div className="flex lg:hidden" style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '6px',
            marginBottom: '6px'
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
                className="h-7 md:h-8 lg:h-9 w-auto object-contain"
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
                className="h-7 md:h-8 lg:h-9 w-auto object-contain"
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
            borderRadius: '6px',
            padding: '6px',
            textAlign: 'center',
            marginTop: '6px',
            marginBottom: '0px'
          }}>
            <p className="text-[10px] md:text-xs lg:text-xs" style={{
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
          className="fixed bottom-0 left-0 w-full z-[9999] bg-white flex justify-center items-center py-2 md:py-3"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            height: 'auto',
            minHeight: '40px',
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
            className="text-xs md:text-sm lg:text-base px-2 text-center"
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
