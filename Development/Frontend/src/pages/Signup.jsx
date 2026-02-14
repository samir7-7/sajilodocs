import { useState, useEffect } from "react";
import {
  FileText,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function SignupPage({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organization: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    const pwd = formData.password;
    setPasswordCriteria({
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the terms to continue");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.fullName,
        email: formData.email,
        password: formData.password,
        first_name: formData.fullName.split(" ")[0],
        last_name: formData.fullName.split(" ").slice(1).join(" "),
      };

      const res = await fetch(`${API}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Handle Django validation errors (which might be objects or arrays)
        if (typeof data === 'object') {
             // Extract first error message if it's a field error
             const firstError = Object.values(data).flat()[0];
             setError(firstError || "Registration failed");
        } else {
             setError(data.detail || "Registration failed");
        }
      } else {
        setMessage(data.message);
        setShowOTPModal(true);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
      } else {
        // Success!
        setShowOTPModal(false);
        // Maybe show a success toast or switch to login
        onSwitchToLogin(); // Or show a success message then switch
        // For now, let's just switch to login as requested "show what user did wrong in UI friendly way" - success is implied by moving forward
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#1D9621] p-3 rounded-xl mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-2">Join SajiloDocs today 🚀</p>
          </div>

          {/* Inline Error/Success Messages */}
          {message && !showOTPModal && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium">Success</p>
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Samir Nepal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-green-600' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                    8+ Characters
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.upper ? 'text-green-600' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.upper ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Uppercase
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.lower ? 'text-green-600' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.lower ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Lowercase
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-green-600' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Number
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.symbol ? 'text-green-600' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.symbol ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Symbol
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                required
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl ${
                loading
                  ? "bg-blue-400 text-white cursor-wait"
                  : "bg-[#1D9621] text-white hover:bg-[#178a1c]"
              }`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
                <button onClick={() => setShowOTPModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <p className="text-gray-600 mb-6">
                We've sent a 6-digit verification code to <span className="font-semibold text-gray-900">{formData.email}</span>. 
                Please enter it below to verify your account.
            </p>

            {otpError && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium">Verification Failed</p>
                    <p className="text-sm">{otpError}</p>
                  </div>
                </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="000000"
                        maxLength={6}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all shadow-lg ${
                        loading || otp.length !== 6
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#1D9621] text-white hover:bg-[#178a1c]"
                    }`}
                >
                    {loading ? "Verifying..." : "Verify Email"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
            </form>
            
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    Didn't receive the code?{" "}
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Resend
                    </button>
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
