import React from 'react';
import { Outlet } from 'react-router-dom';
import FrameImage from '../assets/Frame.jpg';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side: branding / hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-sky-900 overflow-hidden items-center justify-center">
        <img 
          src={FrameImage} 
          alt="Clinic System Frame" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right side: form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
