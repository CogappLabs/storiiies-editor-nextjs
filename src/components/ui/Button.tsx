import Link from "next/link";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  showArrow?: boolean;
  children: ReactNode;
  className?: string;
}

interface ButtonProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {}

interface ButtonLinkProps extends ButtonBaseProps {
  href: string;
}

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cogapp-charcoal text-cogapp-cream border-cogapp-cream hover:bg-cogapp-cream hover:text-cogapp-charcoal",
  secondary:
    "bg-cogapp-cream text-cogapp-charcoal border-cogapp-charcoal hover:bg-cogapp-charcoal hover:text-cogapp-cream",
  ghost: "bg-transparent text-cogapp-cream border-transparent hover:text-white",
  danger:
    "bg-transparent text-red-600 border-red-600 hover:bg-red-600 hover:text-white",
};

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: "pt-1 pb-0.5 px-2 text-sm",
  md: "pt-2 pb-1.5 px-3 text-base",
};

export const buttonBaseStyles =
  "inline-flex items-center font-medium leading-7 border transition-colors";

export const getButtonStyles = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) =>
  `${buttonBaseStyles} ${buttonVariantStyles[variant]} ${buttonSizeStyles[size]}`;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      showArrow,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const displayArrow = showArrow ?? variant === "primary";

    return (
      <button
        ref={ref}
        className={`
					${buttonBaseStyles}
					disabled:opacity-50 disabled:cursor-not-allowed
					${buttonVariantStyles[variant]}
					${buttonSizeStyles[size]}
					${className}
				`}
        disabled={disabled}
        {...props}
      >
        {children}
        {displayArrow && (
          <span
            className="ml-2 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export const ButtonLink = ({
  href,
  className = "",
  variant = "secondary",
  size = "md",
  showArrow,
  children,
}: ButtonLinkProps) => {
  const displayArrow = showArrow ?? false;

  return (
    <Link
      href={href}
      className={`
				${buttonBaseStyles}
				${buttonVariantStyles[variant]}
				${buttonSizeStyles[size]}
				${className}
			`}
    >
      {children}
      {displayArrow && (
        <span
          className="ml-2 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      )}
    </Link>
  );
};

export default Button;
