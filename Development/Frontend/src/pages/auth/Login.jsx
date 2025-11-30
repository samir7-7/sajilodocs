import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Checkbox } from "../../components/common/Checkbox";
import AuthLayout from "../../components/layout/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(email, password, rememberMe);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid email or password");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back 👋🏻"
      subtitle="Sign in to continue to your dashboard."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Button
          type="button"
          variant="outline"
          className="w-full flex justify-center items-center gap-5 py-6 cursor-pointer"
          onClick={() => alert("Google Login Mock")}
        >
          {/* <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-.4167-.0334-.8167-.1-1.2167H12.0003v3.2h4.8334c-.2167 1.1-.85 2.0333-1.8 2.6833v2.2334h2.9166c1.7-1.5667 2.6834-3.8834 2.6834-6.5334 0-6.6333-5.3834-12-12-12s-12 5.3667-12 12 5.3666 12 12 12z" fill="#4285F4" />
            <path d="M12.0003 8.45c2.2667 0 4.3.7833 5.9 2.0667l2.4-2.4C18.217 6.1333 15.317 5.25 12.0003 5.25 7.467 5.25 3.5503 7.8333 1.6336 11.65l2.8 2.1833C5.3503 10.9 8.4003 8.45 12.0003 8.45z" fill="#EA4335" />
            <path d="M1.6336 11.65A8.416 8.416 0 0 0 1.6336 12.35c0 .2333.0167.4667.05.7l-2.8 2.1833A11.96 11.96 0 0 1 .0503 12c0-1.3667.3333-2.6667.9166-3.8333l2.8 2.1833z" fill="#FBBC05" />
            <path d="M12.0003 18.75c-2.4833 0-4.7833-.8-6.5833-2.1667l-2.8 2.1834c1.7166 3.4 5.2333 5.6833 9.3833 5.6833 3.1333 0 5.9333-1.0333 8.0333-2.8l-2.9166-2.2333c-1.05.7-2.7.7-5.1167.7z" fill="#34A853" />
          </svg> */}
          <img
            src="https://th.bing.com/th/id/R.0fa3fe04edf6c0202970f2088edea9e7?rik=joOK76LOMJlBPw&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fgoogle-logo-png-open-2000.png&ehk=0PJJlqaIxYmJ9eOIp9mYVPA4KwkGo5Zob552JPltDMw%3d&risl=&pid=ImgRaw&r=0"
            alt=""
            width={25}
          />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot Password?
            </a>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button
          type="submit"
          className="w-full py-6 text-base"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Create one
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
