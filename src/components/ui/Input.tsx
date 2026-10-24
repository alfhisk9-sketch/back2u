import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#3C534B] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C938C]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'block w-full rounded-lg border border-[#CBD5CE] bg-white px-3.5 py-2 text-sm text-[#12241E] placeholder-[#8EA59E]',
                'transition-colors duration-150 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20',
                leftIcon && 'pl-9',
                error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
                className
              )
            )}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#536B63]">{helperText}</p>
        )}
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#3C534B] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={twMerge(
            clsx(
              'block w-full rounded-lg border border-[#CBD5CE] bg-white px-3.5 py-2 text-sm text-[#12241E] placeholder-[#8EA59E]',
              'transition-colors duration-150 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 shadow-2xs',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#536B63]">{helperText}</p>
        )}
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
