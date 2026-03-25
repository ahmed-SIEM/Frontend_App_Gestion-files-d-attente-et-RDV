import { cn } from "./utils";

export function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base text-gray-900",
        "placeholder:text-gray-400 selection:bg-blue-100 selection:text-blue-900",
        "transition-all outline-none",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700",
        className
      )}
      {...props}
    />
  );
}