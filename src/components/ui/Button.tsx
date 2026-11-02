import Link from "next/link";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-cogapp-charcoal text-cogapp-cream border-cogapp-cream hover:bg-cogapp-cream hover:text-cogapp-charcoal",
  secondary:
    "bg-cogapp-cream text-cogapp-charcoal border-cogapp-charcoal hover:bg-cogapp-charcoal hover:text-cogapp-cream",
  ghost: "bg-transparent text-cogapp-cream border-transparent hover:text-white",
  danger:
    "bg-transparent text-danger border-danger hover:bg-danger hover:text-white",
};

const sizeStyles: Record<Size, string> = {
  sm: "pt-1 pb-0.5 px-2 text-sm",
  md: "pt-2 pb-1.5 px-3 text-base",
};

const classes = ({ variant = "primary", size = "md", className }: StyleProps) =>
  [
    "group inline-flex items-center font-medium leading-7 border transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantStyles[variant],
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

const Arrow = () => (
  <span
    className="ml-2 transition-transform group-hover:translate-x-1"
    aria-hidden="true"
  >
    →
  </span>
);

interface ButtonProps
  extends StyleProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** Defaults to on for primary buttons. */
  showArrow?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size, className, showArrow, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      className={classes({ variant, size, className })}
      {...props}
    >
      {children}
      {(showArrow ?? variant === "primary") && <Arrow />}
    </button>
  ),
);

Button.displayName = "Button";

export const ButtonLink = ({
  href,
  children,
  ...style
}: StyleProps & { href: string; children: ReactNode }) => (
  <Link href={href} className={classes({ variant: "secondary", ...style })}>
    {children}
  </Link>
);

export default Button;
