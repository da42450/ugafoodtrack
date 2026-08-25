"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 min-h-12 px-5 font-semibold touch-manipulation select-none transition-transform duration-75 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--uga-red)] text-white",
  secondary: "bg-white text-black border-2 border-black",
  ghost: "bg-transparent text-black border border-[var(--uga-border)]",
  dark: "bg-black text-white",
};

export function PressButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PressLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
