"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
  DialogClose,
  type DialogSize,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

// ============================================================================
// Responsive Sheet Context
// 使用 Context 避免子組件重複調用 useMediaQuery
// ============================================================================

const ResponsiveSheetContext = React.createContext<boolean | null>(null);

/**
 * Hook to get desktop state from context
 * Falls back to useMediaQuery if used outside ResponsiveSheet
 */
function useIsDesktop(): boolean {
  const context = React.useContext(ResponsiveSheetContext);
  const fallback = useMediaQuery("(min-width: 640px)");
  return context ?? fallback;
}

// ============================================================================
// Responsive Sheet
// 桌面版使用 Dialog，手機版使用底部 Drawer
// ============================================================================

interface ResponsiveSheetProps {
  /** 是否開啟 */
  open?: boolean;
  /** 開啟狀態變更回調 */
  onOpenChange?: (open: boolean) => void;
  /** 子內容 */
  children: React.ReactNode;
}

function ResponsiveSheet({ open, onOpenChange, children }: ResponsiveSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const content = isDesktop ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  );

  return (
    <ResponsiveSheetContext.Provider value={isDesktop}>
      {content}
    </ResponsiveSheetContext.Provider>
  );
}

interface ResponsiveSheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

function ResponsiveSheetTrigger({ children, asChild, className }: ResponsiveSheetTriggerProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <DialogTrigger asChild={asChild} className={className}>
        {children}
      </DialogTrigger>
    );
  }

  return (
    <DrawerTrigger asChild={asChild} className={className}>
      {children}
    </DrawerTrigger>
  );
}

interface ResponsiveSheetContentProps {
  children: React.ReactNode;
  className?: string;
  /** Dialog size (only applies to desktop) */
  size?: DialogSize;
  /** Whether to show close button (desktop only) */
  showCloseButton?: boolean;
}

function ResponsiveSheetContent({
  children,
  className,
  size = "lg",
  showCloseButton = true,
}: ResponsiveSheetContentProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <DialogContent size={size} className={className} showCloseButton={showCloseButton}>
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={cn("max-h-[90vh]", className)}>
      {children}
    </DrawerContent>
  );
}

interface ResponsiveSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveSheetHeader({ children, className }: ResponsiveSheetHeaderProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogHeader className={className}>{children}</DialogHeader>;
  }

  return <DrawerHeader className={className}>{children}</DrawerHeader>;
}

interface ResponsiveSheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveSheetTitle({ children, className }: ResponsiveSheetTitleProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

interface ResponsiveSheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveSheetDescription({ children, className }: ResponsiveSheetDescriptionProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogDescription className={className}>{children}</DialogDescription>;
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>;
}

interface ResponsiveSheetBodyProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveSheetBody({ children, className }: ResponsiveSheetBodyProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogBody className={className}>{children}</DialogBody>;
  }

  return <DrawerBody className={className}>{children}</DrawerBody>;
}

interface ResponsiveSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveSheetFooter({ children, className }: ResponsiveSheetFooterProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogFooter className={className}>{children}</DialogFooter>;
  }

  return <DrawerFooter className={className}>{children}</DrawerFooter>;
}

interface ResponsiveSheetCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

function ResponsiveSheetClose({ children, asChild, className }: ResponsiveSheetCloseProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <DialogClose asChild={asChild} className={className}>
        {children}
      </DialogClose>
    );
  }

  return (
    <DrawerClose asChild={asChild} className={className}>
      {children}
    </DrawerClose>
  );
}

export {
  ResponsiveSheet,
  ResponsiveSheetTrigger,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
  ResponsiveSheetBody,
  ResponsiveSheetFooter,
  ResponsiveSheetClose,
};
