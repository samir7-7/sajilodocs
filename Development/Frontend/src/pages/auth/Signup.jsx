import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Checkbox } from "../../components/common/Checkbox";
import AuthLayout from "../../components/layout/AuthLayout";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await signup(formData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Failed to create account");
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join thousands of professionals securing their assets."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            className="group-hover:border-white/20"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contact"
              name="contact"
              type="tel"
              placeholder="+977"
              value={formData.contact}
              onChange={handleChange}
              required
              className="group-hover:border-white/20"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="group-hover:border-white/20"
            />
          </div>

          <div className="relative">
            <Input
              label="Create Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="group-hover:border-white/20"
            />
            <button
              type="button"
              className="absolute right-4 top-[42px] text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="group-hover:border-white/20"
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            id="terms"
            label={
              <span className="text-slate-400 text-xs">
                I agree to the{" "}
                <Link to="/terms" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                  Terms & Privacy Policy
                </Link>
              </span>
            }
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="border-white/10 bg-white/5"
          />
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-7 text-base font-bold bg-[#0061FF] hover:bg-[#0052D9] border-none shadow-xl shadow-blue-500/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          isLoading={isLoading}
        >
          Create Premium Account
        </Button>

        <div className="text-center pt-2">
          <p className="text-slate-400 text-sm font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline-offset-4 hover:underline"
            >
              Sign back in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Signup;
