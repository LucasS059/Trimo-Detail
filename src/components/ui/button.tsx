import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "sm";
};

const VARIANTES = {
  primary: "bg-[#E56B25] text-white hover:bg-[#cf5818]",
  secondary: "bg-zinc-700 text-zinc-100 border border-zinc-600 hover:bg-zinc-600",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const TAMANHOS = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function Button({ 
  variant = "primary", 
  size = "default", 
  className = "", 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variant]} ${TAMANHOS[size]} ${className}`}
      {...props}
    />
  );
}