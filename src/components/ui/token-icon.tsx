"use client";

import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getTokenBySymbol } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type CryptoIconSize = "16px" | "20px" | "24px" | "32px" | "40px" | "48px" | "56px";

interface TokenIconProps {
  /** Token symbol (ETH, USDT, USDC, etc.) */
  symbol: string;
  /** Icon size */
  size?: CryptoIconSize;
  /** Optional className for wrapper */
  className?: string;
}

/**
 * Size mapping from pixel strings to Tailwind classes
 */
const SIZE_CLASSES: Record<CryptoIconSize, { container: string; text: string }> = {
  "16px": { container: "size-4", text: "text-[6px]" },
  "20px": { container: "size-5", text: "text-[8px]" },
  "24px": { container: "size-6", text: "text-[10px]" },
  "32px": { container: "size-8", text: "text-xs" },
  "40px": { container: "size-10", text: "text-sm" },
  "48px": { container: "size-12", text: "text-base" },
  "56px": { container: "size-14", text: "text-lg" },
};

/**
 * Token Icon Component
 *
 * Renders crypto token icons using @ledgerhq/crypto-icons
 * Falls back to first letter if token not found
 */
export function TokenIcon({ symbol, size = "24px", className }: TokenIconProps) {
  const token = getTokenBySymbol(symbol);
  const sizeClasses = SIZE_CLASSES[size];

  if (!token) {
    // Fallback: show first letter with Tailwind classes
    return (
      <div
        className={cn(
          "rounded-full bg-keylio-bg-tertiary flex items-center justify-center font-semibold text-keylio-text-muted shrink-0",
          sizeClasses.container,
          sizeClasses.text,
          className
        )}
      >
        {symbol.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <CryptoIcon
      ledgerId={token.ledgerId}
      ticker={token.ticker}
      size={size}
      network={token.network}
    />
  );
}

export default TokenIcon;
