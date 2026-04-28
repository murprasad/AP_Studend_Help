"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const setOpen = React.useCallback((val: boolean) => {
    onOpenChange?.(val)
  }, [onOpenChange])

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const { setOpen } = React.useContext(DialogContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    })
  }

  return (
    <button onClick={() => setOpen(true)}>{children}</button>
  )
}

function DialogContent({
  className,
  children,
  hideClose = false,
  blockOutsideClick = false,
}: {
  className?: string;
  children: React.ReactNode;
  /** Hide the X close button (use when the dialog must be answered, not dismissed) */
  hideClose?: boolean;
  /** Block the backdrop click from dismissing the dialog (mandatory-action dialogs) */
  blockOutsideClick?: boolean;
}) {
  const { open, setOpen } = React.useContext(DialogContext)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={blockOutsideClick ? undefined : () => setOpen(false)}
      />
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
          "w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {!hideClose && (
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </>
  )
}

function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}

function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground mt-1", className)}>{children}</p>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription }
