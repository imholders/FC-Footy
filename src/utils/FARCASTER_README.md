# Farcaster Integration Utilities

This directory contains utilities for integrating with Farcaster, including Frame detection and user authentication.

## Available Utilities

### 1. Frame Context Detection

```typescript
import { isFarcasterFrame, getFarcasterContext } from '../utils/farcasterContext';

// Check if the current context is a Farcaster Frame
const isFrame = isFarcasterFrame();

// Get Frame context data (if in a Frame)
if (isFrame) {
  const context = getFarcasterContext();
  console.log('FID:', context.fid);
  console.log('Button Index:', context.buttonIndex);
  console.log('Input Text:', context.inputText);
}
```

### 2. User Authentication

```typescript
import { isFarcasterUser, getFarcasterUserData } from '../utils/farcasterContext';
import { usePrivy } from '@privy-io/react-auth';

// In your component
const { user } = usePrivy();

// Check if user is authenticated via Farcaster
if (user && isFarcasterUser(user)) {
  // User is authenticated via Farcaster
  const farcasterData = getFarcasterUserData(user);
  console.log('Username:', farcasterData.username);
  console.log('FID:', farcasterData.fid);
}
```

## Type Definitions

### FarcasterFrameContext

```typescript
interface FarcasterFrameContext {
  isFrame: boolean;
  fid?: number;
  messageHash?: string;
  url?: string;
  timestamp?: number;
  network?: 'mainnet' | 'testnet';
  buttonIndex?: number;
  inputText?: string;
  castId?: {
    fid: number;
    hash: string;
  };
}
```

## Example Usage

See the example component at `src/components/FarcasterContextExample.tsx` and the example page at `src/app/farcaster-example/page.tsx`.

## Notes on Type Compatibility

When using these utilities with the Privy user object, you may encounter type compatibility issues. This is because the Privy user object has a more complex structure than our simplified interfaces.

To work around this, you can use type assertions:

```typescript
// Option 1: Type assertion
const isFarcaster = isFarcasterUser(user as any);

// Option 2: Create a simplified object
const simplifiedUser = {
  id: user.id,
  linkedAccounts: user.linkedAccounts
};
const isFarcaster = isFarcasterUser(simplifiedUser as any);
```

In a production environment, you should define proper interfaces that match the Privy user object structure to avoid using `any`. 