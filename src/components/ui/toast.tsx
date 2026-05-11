import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[1.25rem] border p-4 pr-10 shadow-2xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full backdrop-blur-xl",
  {
    variants: {
      variant: {
        default: "border-border bg-card/80 text-foreground",
        destructive:
          "destructive group border-toast-destructive-border bg-toast-destructive-bg/90 text-toast-destructive-text",
        success: 
          "success group border-toast-success-border bg-toast-success-bg/90 text-toast-success-text",
        warning:
          "warning group border-toast-warning-border bg-toast-warning-bg/90 text-toast-warning-text",
        info:
          "info group border-toast-info-border bg-toast-info-bg/90 text-toast-info-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex w-full gap-4 items-start">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110",
          variant === "success" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
          variant === "destructive" && "bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30",
          variant === "warning" && "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30",
          variant === "info" && "bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30",
          (!variant || variant === "default") && "bg-muted text-muted-foreground ring-1 ring-border"
        )}>
          {variant === "destructive" && <AlertCircle className="h-5 w-5" />}
          {variant === "success" && <CheckCircle2 className="h-5 w-5" />}
          {variant === "warning" && <AlertCircle className="h-5 w-5" />}
          {variant === "info" && <AlertCircle className="h-5 w-5" />}
          {(!variant || variant === "default") && <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="grid gap-1.5 py-1">
          {children}
        </div>
      </div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-xl border bg-transparent px-4 text-xs font-bold uppercase tracking-widest ring-offset-background transition-all hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-3 top-3 rounded-lg p-1.5 text-foreground/30 opacity-0 transition-all hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-toast-destructive-text group-[.destructive]:hover:text-toast-destructive-text group-[.success]:text-toast-success-text group-[.success]:hover:text-toast-success-text",
        className
      )}
      toast-close=""
      aria-label="Close"
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
