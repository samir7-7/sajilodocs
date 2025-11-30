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
      subtitle="Start managing your documents securely."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Button
          type="button"
          variant="outline"
          className="w-full flex justify-center items-center gap-2 py-6"
          onClick={() => alert("Google Signup Mock")}
        >
          <img
            src="https://th.bing.com/th/id/R.0fa3fe04edf6c0202970f2088edea9e7?rik=joOK76LOMJlBPw&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fgoogle-logo-png-open-2000.png&ehk=0PJJlqaIxYmJ9eOIp9mYVPA4KwkGo5Zob552JPltDMw%3d&risl=&pid=ImgRaw&r=0"
            alt=""
            width={25}
          />
          Sign up with Google
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
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />

          <Input
            label="Contact Number"
            name="contact"
            type="tel"
            value={formData.contact}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
            <button
              type="button"
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <Checkbox
          id="terms"
          label={
            <span>
              I agree to the{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms and Conditions
              </a>
            </span>
          }
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
        />

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button
          type="submit"
          className="w-full py-6 text-base"
          isLoading={isLoading}
        >
          Create Account
        </Button>

        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Signup;
