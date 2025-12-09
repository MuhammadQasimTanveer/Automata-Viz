import React from 'react';
import { clsx } from 'clsx';

export const Button = ({ children,  variant = 'primary', size = 'md', className,disabled, ...props }) => 
{
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md',
    outline: 'bg-transparent text-slate-700 border-2 border-slate-300 hover:border-indigo-600 hover:text-indigo-600',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
  };
  
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-6 py-2.5 text-base', lg: 'px-8 py-3 text-lg',};
  
  return (
    <button className={clsx( baseStyles, variants[variant],sizes[size], className )}
       disabled={disabled} {...props}
    >
      {children}
    </button>
  );
};