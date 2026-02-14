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
      title="Welcome Back"
      subtitle="Enter your credentials to access your secure vault."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="group-hover:border-white/20"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-sm font-semibold text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="group-hover:border-white/20"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <Checkbox
            id="remember-me"
            label={<span className="text-slate-400 text-sm">Keep me signed in</span>}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="border-white/10 bg-white/5"
          />
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-7 text-base font-bold bg-[#0061FF] hover:bg-[#0052D9] border-none shadow-xl shadow-blue-500/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          isLoading={isLoading}
        >
          Sign In to Dashboard
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-[#151d2f] px-4 text-slate-500 font-bold">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex justify-center items-center gap-3 py-6 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all duration-300"
          onClick={() => alert("Google Login Mock")}
        >
          <img
            src="https://th.bing.com/th/id/R.0fa3fe04edf6c0202970f2088edea9e7?rik=joOK76LOMJlBPw&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fgoogle-logo-png-open-2000.png&ehk=0PJJlqaIxYmJ9eOIp9mYVPA4KwkGo5Zob552JPltDMw%3d&risl=&pid=ImgRaw&r=0"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="font-bold">Google Account</span>
        </Button>

        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium">
            New here?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline-offset-4 hover:underline"
            >
              Create a premium account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
