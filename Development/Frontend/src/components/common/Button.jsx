import React from "react";
import { cn } from "../../utils/cn";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-[#0061FF] text-white hover:bg-[#0052D9] shadow-lg shadow-blue-500/20",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      outline:
        "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600",
      ghost: "hover:bg-slate-50 text-slate-600",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/10",
    };

    const sizes = {
      default: "h-12 px-6 py-3",
      sm: "h-10 rounded-xl px-4",
      lg: "h-14 rounded-2xl px-10 text-base",
      icon: "h-12 w-12",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
