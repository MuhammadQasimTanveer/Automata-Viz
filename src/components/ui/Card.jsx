import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm',
        hover && 'card-hover cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-200', className)}> {children} </div>
  );
};

export const CardTitle = ({ children, className }) => {
  return (
    <h3 className={clsx('text-xl font-bold text-slate-900', className)}>{children} </h3>
  );
};

export const CardContent = ({ children, className }) => {
  return (
    <div className={clsx('px-6 py-4', className)}> {children} </div>
  );
};