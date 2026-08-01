import api from '../services/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('SEND_OTP'); // 'SEND_OTP' | 'VERIFY_OTP'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    console.log("Send OTP button clicked");
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/send-otp', { email });
      setMessage(response.data.message || 'OTP sent to your email');
      if (response.data.previewUrl) {
        console.log('Ethereal Email Preview:', response.data.previewUrl);
      }
      setStep('VERIFY_OTP');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', { email, code: otp });
      const { token, user } = response.data;

      // Store JWT token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to /resources
      navigate('/resources');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center">
      <div className="surface w-full max-w-md p-5 sm:p-8">
        <h1 className="page-title text-center">CampusDesk</h1>
        <p className="page-subtitle mb-6 text-center">Sign in with your email OTP</p>

        {error && (
          <div className="message-error mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="message-success mb-4">
            {message}
          </div>
        )}

        {step === 'SEND_OTP' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="field-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="field-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="field-label">
                Enter OTP Code
              </label>
              <input
                id="login-otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="field-input text-center text-lg tracking-[0.3em]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => setStep('SEND_OTP')}
              className="w-full text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
            >
              Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
