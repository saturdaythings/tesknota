import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-[var(--body)] font-medium uppercase tracking-[0.08em] text-xs h-8 px-4 cursor-pointer border-none select-none transition-all duration-[140ms] disabled:opacity-[0.38] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        blue: "bg-[var(--blue)] text-white hover:bg-[var(--blue2)]",
        warm: "bg-[var(--warm)] text-white hover:bg-[var(--warm-hover)]",
        ghost:
          "bg-transparent border border-[var(--b3)] text-[var(--ink2)] hover:bg-[var(--off2)]",
        bare: "bg-transparent border-none text-[var(--ink3)] tracking-[0.06em] px-2 py-1 h-auto hover:text-[var(--blue)]",
        danger:
          "bg-transparent border border-[rgba(var(--rose-ch),0.3)] text-[var(--rose-tk)] hover:bg-[rgba(var(--rose-ch),0.08)]",
      },
      size: {
        default: "h-8 px-4",
        sm: "h-[26px] px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "blue",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
