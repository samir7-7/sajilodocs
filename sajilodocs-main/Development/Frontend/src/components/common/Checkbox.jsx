import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Checkbox = React.forwardRef(({ className, label, id, ...props }, ref) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={id}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition duration-150 ease-in-out",
          className
        )}
        ref={ref}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-400 select-none cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
