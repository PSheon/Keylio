"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Dialog Design Tokens
// ============================================================================
const DIALOG_TOKENS = {
  overlay: {
    base: "bg-black/60 backdrop-blur-sm",
  },
  content: {
    bg: "bg-keylio-bg-secondary",
    border: "border-keylio-border",
    text: "text-keylio-text-primary",
  },
  close: {
    bg: "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80",
    text: "text-keylio-text-secondary hover:text-keylio-text-primary",
  },
} as const

// ============================================================================
// Size Variants for DialogContent
// ============================================================================
const dialogContentVariants = cva(
  // Base styles
  [
    "fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%]",
    "rounded-xl border shadow-2xl duration-200",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    DIALOG_TOKENS.content.bg,
    DIALOG_TOKENS.content.border,
    DIALOG_TOKENS.content.text,
  ],
  {
    variants: {
      size: {
        sm: "max-w-[calc(100%-2rem)] sm:max-w-sm p-4 gap-3",
        md: "max-w-[calc(100%-2rem)] sm:max-w-md p-5 gap-4",
        lg: "max-w-[calc(100%-2rem)] sm:max-w-lg p-6 gap-4",
        xl: "max-w-[calc(100%-2rem)] sm:max-w-xl p-6 gap-5",
        full: "max-w-[calc(100%-1rem)] sm:max-w-2xl max-h-[90vh] p-6 gap-4 overflow-y-auto",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

export type DialogSize = VariantProps<typeof dialogContentVariants>["size"]

// ============================================================================
// Base Dialog Components
// ============================================================================

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        DIALOG_TOKENS.overlay.base,
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  showCloseButton?: boolean
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-keylio-teal/50",
              "disabled:pointer-events-none",
              DIALOG_TOKENS.close.bg,
              DIALOG_TOKENS.close.text,
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
            )}
          >
            <XIcon />
            <span className="sr-only">關閉</span>
          </DialogPrimitive.Close> : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// ============================================================================
// Header, Footer, Title, Description
// ============================================================================

interface DialogHeaderProps extends React.ComponentProps<"div"> {
  /** Optional icon to display before title */
  icon?: React.ReactNode
}

function DialogHeader({ className, icon, children, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {icon ? <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-keylio-bg-tertiary text-keylio-teal">
            {icon}
          </div>
        </div> : null}
      {children}
    </div>
  )
}

interface DialogFooterProps extends React.ComponentProps<"div"> {
  /** Stack buttons vertically on all screen sizes */
  stack?: boolean
}

function DialogFooter({ className, stack = false, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex gap-3 pt-2",
        stack
          ? "flex-col"
          : "flex-col-reverse sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold leading-tight text-keylio-text-primary text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-keylio-text-secondary text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

/** Body container for dialog content with consistent spacing */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

// ============================================================================
// Exports
// ============================================================================

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  // Types
  type DialogContentProps,
  // Tokens for external use
  DIALOG_TOKENS,
}
