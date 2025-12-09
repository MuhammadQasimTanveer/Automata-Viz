import React from 'react';
import { clsx } from 'clsx';

export const Input = React.forwardRef(({ label, error,helperText, className, containerClassName,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && ( <label className="block text-sm font-semibold text-slate-700 mb-2"> {label}</label> )}

      <input ref={ref} className={clsx( 'input-field', error && 'error', className)} {...props}/>

      {error && (
        <p className="mt-2 text-sm text-red-600 animate-slide-down"> {error} </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-slate-500"> {helperText} </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';