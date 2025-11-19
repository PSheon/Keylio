# GitHub Copilot Instructions for Keylio Wallet

## Project Overview

Keylio is a decentralized HD wallet web application for Plasma chain stablecoin users. Core principles: **anonymous-first, dual-layer encryption, perfect UI/UX**.

**Tech Stack**: Next.js 15 (App Router), TypeScript 5.x (strict), React 19, TailwindCSS 4, shadcn/ui, ethers.js v6, Zustand, Dexie.js, Supabase

---

## Development Philosophy

### Incremental Development
- Build features step-by-step, validating each component before moving forward
- Write minimal viable code first, then refactor for optimization
- Commit frequently with clear, descriptive messages
- Each PR should focus on a single feature or fix

### Keep It Simple
- Prefer simple, readable code over clever abstractions
- Avoid premature optimization
- Use established patterns from shadcn/ui and Next.js conventions
- Delete unused code immediately

### Code Quality Standards
- TypeScript strict mode - no `any` types without explicit justification
- All functions must have clear input/output types
- Prefer functional components with hooks over class components
- Extract reusable logic into custom hooks

---

## Code Style Guidelines

### TypeScript Conventions
```typescript
// ✅ DO: Explicit return types for functions
export function deriveWallet(mnemonic: string, index: number): Wallet {
  // implementation
}

// ❌ DON'T: Implicit any or missing types
export function deriveWallet(mnemonic, index) {
  // implementation
}

// ✅ DO: Use const assertions for readonly objects
const DERIVATION_PATH = 'm/44\'/60\'/0\'/0' as const;

// ✅ DO: Use type guards
function isValidMnemonic(input: unknown): input is string {
  return typeof input === 'string' && input.split(' ').length === 12;
}
```

### React Patterns
```typescript
// ✅ DO: Use function components with named exports
export function WalletCard({ wallet, onSelect }: WalletCardProps) {
  // component logic
}

// ✅ DO: Extract complex logic to custom hooks
function useWalletBalance(address: string) {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: () => fetchBalance(address),
  });
}

// ✅ DO: Memoize expensive computations
const totalBalance = useMemo(() => 
  wallets.reduce((sum, w) => sum + w.balance, 0),
  [wallets]
);
```

### Component Organization
```
components/
├── ui/              # shadcn/ui components (DO NOT modify)
├── wallet/          # Wallet-specific components
│   ├── WalletCard.tsx
│   ├── WalletList.tsx
│   └── CreateWalletDialog.tsx
├── transaction/     # Transaction components
└── shared/          # Shared/common components
```

---

## Security Requirements

### Critical Rules
1. **Never log sensitive data**: Mnemonic, private keys, passwords, Passkey credentials
2. **Clear sensitive data from memory**: After encryption/decryption operations
3. **Use Web Crypto API**: For all cryptographic operations (never custom crypto)
4. **Validate all user inputs**: Especially addresses, amounts, and mnemonic phrases
5. **Never store plaintext secrets**: Everything must be encrypted before IndexedDB storage

### Encryption Patterns
```typescript
// ✅ DO: Use constant-time comparison for sensitive data
import { timingSafeEqual } from 'crypto';

// ✅ DO: Generate secure random values
const salt = crypto.getRandomValues(new Uint8Array(16));

// ✅ DO: Clear sensitive variables
let mnemonic: string | null = generateMnemonic();
// ... use mnemonic ...
mnemonic = null; // Clear reference

// ❌ DON'T: Log or console.log sensitive data
console.log('Mnemonic:', mnemonic); // NEVER DO THIS
```

---

## UI/UX Guidelines

### Design System
- **Colors**: Use Tailwind classes from design spec (`bg-[#0a0e27]`, `text-[#14b8a6]`)
- **Spacing**: 4px grid system (use `space-y-4`, `p-4`, `gap-6`, etc.)
- **Typography**: Inter (EN) + Noto Sans TC (ZH), use `font-semibold` for headings
- **Animations**: Framer Motion for transitions, keep under 300ms for interactions

### Component Standards
```typescript
// ✅ DO: Use shadcn/ui components as base
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ✅ DO: Follow responsive design patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ DO: Add loading states
{isLoading ? <Skeleton className="h-20 w-full" /> : <WalletCard />}

// ✅ DO: Use semantic HTML
<button> for actions, <a> for navigation
```

### Accessibility
- All interactive elements must have accessible labels
- Use `aria-label` for icon-only buttons
- Maintain keyboard navigation support
- Color contrast must meet WCAG 2.1 AA (use Tailwind's default palette)

---

## Blockchain Integration

### ethers.js Patterns
```typescript
// ✅ DO: Use proper provider configuration
const provider = new JsonRpcProvider(PLASMA_RPC_URL, {
  chainId: PLASMA_CHAIN_ID,
  name: 'Plasma',
});

// ✅ DO: Handle transaction errors gracefully
try {
  const tx = await wallet.sendTransaction({ to, value });
  await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle specific error
  }
  throw error;
}

// ✅ DO: Validate addresses before use
import { isAddress, getAddress } from 'ethers';
if (!isAddress(address)) {
  throw new Error('Invalid Ethereum address');
}
```

### HD Wallet Implementation
```typescript
// ✅ DO: Use standard BIP44 derivation path
const DERIVATION_PATH = "m/44'/60'/0'/0";

// ✅ DO: Derive wallets from mnemonic
function deriveSubWallet(mnemonic: string, index: number): HDNodeWallet {
  return HDNodeWallet.fromPhrase(mnemonic).derivePath(`${DERIVATION_PATH}/${index}`);
}

// ❌ DON'T: Store derived private keys (always derive on-demand)
```

---

## State Management

### Zustand Store Patterns
```typescript
// ✅ DO: Use typed stores with selectors
interface WalletState {
  wallets: SubWallet[];
  currentWallet: SubWallet | null;
  addWallet: (wallet: SubWallet) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  currentWallet: null,
  addWallet: (wallet) => set((state) => ({ 
    wallets: [...state.wallets, wallet] 
  })),
}));

// ✅ DO: Use shallow selectors to prevent re-renders
const wallets = useWalletStore((state) => state.wallets, shallow);
```

### IndexedDB with Dexie
```typescript
// ✅ DO: Define schema clearly
export class WalletDB extends Dexie {
  subWallets!: Table<SubWallet, number>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('KeylioWallet');
    this.version(1).stores({
      subWallets: '++id, address, index, isDefault',
      transactions: 'hash, subWalletId, timestamp, status',
    });
  }
}

// ✅ DO: Use transactions for atomic operations
await db.transaction('rw', db.subWallets, db.transactions, async () => {
  await db.subWallets.add(newWallet);
  await db.transactions.bulkAdd(transactions);
});
```

---

## Testing Requirements

### Unit Tests
```typescript
// ✅ DO: Test pure functions thoroughly
describe('deriveSubWallet', () => {
  it('should derive correct address for index 0', () => {
    const wallet = deriveSubWallet(TEST_MNEMONIC, 0);
    expect(wallet.address).toBe(EXPECTED_ADDRESS);
  });
});

// ✅ DO: Test edge cases
it('should throw on invalid mnemonic', () => {
  expect(() => deriveSubWallet('invalid', 0)).toThrow();
});
```

### Integration Tests
- Test Passkey registration/verification flow (mock WebAuthn)
- Test encryption/decryption roundtrip
- Test IndexedDB operations with cleanup

---

## Performance Optimization

### Code Splitting
```typescript
// ✅ DO: Lazy load heavy dependencies
const Charts = dynamic(() => import('@/components/Charts'), {
  loading: () => <Skeleton className="h-[300px]" />,
});

// ✅ DO: Split route-level components
// app/send/page.tsx - automatically code split
```

### Caching Strategy
- Cache blockchain queries with React Query (5min stale time)
- Cache balance data in IndexedDB
- Use Service Worker for static assets (Next.js built-in)

---

## Error Handling

### User-Facing Errors
```typescript
// ✅ DO: Provide actionable error messages
if (!isValidMnemonic(input)) {
  toast.error('助記詞格式錯誤，請確認是 12 個英文單字');
  return;
}

// ✅ DO: Log errors for debugging (without sensitive data)
import { captureException } from '@/lib/error-tracking';
try {
  // operation
} catch (error) {
  captureException(error, { context: 'wallet-creation' });
  toast.error('錢包創建失敗，請稍後再試');
}
```

---

## Git Workflow

### Commit Messages
```
feat: add Passkey registration flow
fix: resolve IndexedDB race condition in wallet unlock
refactor: extract encryption logic to separate module
perf: optimize balance query with batching
docs: update API documentation for HD wallet
test: add unit tests for mnemonic validation
```

### Branch Naming
- `feature/passkey-auth`
- `fix/transaction-status-update`
- `refactor/crypto-module`

---

## Common Patterns

### Form Validation
```typescript
// ✅ DO: Use Zod for schema validation
import { z } from 'zod';

const walletSchema = z.object({
  name: z.string().min(1).max(20),
  ensName: z.string().regex(/^[\w-]+\.eth$/).optional(),
});

// Use with react-hook-form
const form = useForm({
  resolver: zodResolver(walletSchema),
});
```

### Loading States
```typescript
// ✅ DO: Show skeleton screens
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
) : (
  <WalletList wallets={wallets} />
)}
```

---

## Don'ts - Common Anti-Patterns

❌ **DON'T** use `localStorage` for sensitive data (use IndexedDB with encryption)
❌ **DON'T** make blockchain calls in component render (use React Query)
❌ **DON'T** inline styles (use Tailwind classes)
❌ **DON'T** create CSS modules (TailwindCSS only)
❌ **DON'T** use `useEffect` for data fetching (use React Query)
❌ **DON'T** mutate state directly (use Zustand's `set` function)
❌ **DON'T** commit commented-out code (delete it)
❌ **DON'T** use `@ts-ignore` (fix the type error properly)

---

## Questions to Ask Before Coding

1. Is this the simplest solution that solves the problem?
2. Does this handle the error case gracefully?
3. Is sensitive data properly encrypted and cleared?
4. Will this component re-render unnecessarily?
5. Is this accessible to keyboard and screen reader users?
6. Does this follow the existing patterns in the codebase?

---

## References

- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com
- ethers.js v6: https://docs.ethers.org/v6
- Zustand: https://docs.pmnd.rs/zustand
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

---

**Remember**: Incremental progress beats perfect code. Ship working features, then iterate.