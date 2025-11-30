import React from "react";
import { ShieldCheck, Globe, Lock } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 flex-col justify-between p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center text-[#1D9621]">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-bold text-gray-900">SajiloDocs</span>
        </div>

        {/* Main Content */}
        <div className="z-10 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            The Future of Secure Document Management
          </h1>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg text-[#1D9621] mt-1">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Intelligent OCR</h3>
                <p className="text-gray-500 text-sm">
                  Extract text from any document instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg text-[#1D9621] mt-1">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Seamless Translation
                </h3>
                <p className="text-gray-500 text-sm">
                  Translate documents into 100+ languages.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg text-[#1D9621] mt-1">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Encrypted Sharing
                </h3>
                <p className="text-gray-500 text-sm">
                  Share securely with end-to-end encryption.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-sm text-gray-400">
          © 2025 DocuSecure Inc. All rights reserved.
        </div>

        {/* Decorative Background Circle */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
