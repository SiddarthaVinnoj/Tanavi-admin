import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaKey } from 'react-icons/fa';
import Modal from '../components/Modal';
import API_URL from '../utils/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'OTP Sent!',
          message: `A 6-digit OTP has been sent to ${email}. Please check your inbox.`
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Failed',
          message: data.message || 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Cannot connect to server. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Invalid OTP',
        message: 'Please enter the 6-digit OTP sent to your email.'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin-auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        setStep(3);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'OTP Verified!',
          message: 'Please enter your new password.'
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Verification Failed',
          message: data.message || 'Invalid OTP. Please try again.'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Cannot connect to server. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.'
      });
      return;
    }

    if (newPassword.length < 6) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Password Reset Successful!',
          message: 'Your password has been reset. You can now login with your new password.'
        });
        setTimeout(() => navigate('/'), 2000);
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Reset Failed',
          message: data.message || 'Failed to reset password. Please try again.'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Cannot connect to server. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
      
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-600 mt-2">Tanavi Properties Admin</p>
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Admin Email <span className="text-red-500">*</span></label>
              <div className="flex items-center border rounded">
                <FaEnvelope className="ml-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none"
                  placeholder="Enter your admin email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                OTP sent to: <strong>{email}</strong>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">Enter OTP <span className="text-red-500">*</span></label>
              <div className="flex items-center border-2 border-blue-300 rounded">
                <FaKey className="ml-3 text-blue-600" />
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 focus:outline-none text-center text-2xl tracking-widest font-bold"
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-3 text-blue-600 hover:underline"
            >
              ← Back to Email
            </button>
          </form>
        )}

        {/* Step 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✓ OTP Verified! Set your new password.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">New Password <span className="text-red-500">*</span></label>
              <div className="flex items-center border rounded">
                <FaLock className="ml-3 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none"
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
              <div className="flex items-center border rounded">
                <FaLock className="ml-3 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-600 hover:underline font-semibold">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
