# PayPal Integration Quick Reference

## Quick Setup (5 minutes)

1. **Get PayPal Credentials**
   ```
   → https://developer.paypal.com/
   → Dashboard → My Apps & Credentials
   → Create App → Copy Client ID & Secret
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Test**
   ```bash
   npm run dev
   # Click Tip Jar → Enter amount → Complete on PayPal sandbox
   ```

## Environment Variables

```env
VITE_PAYPAL_CLIENT_ID=your_client_id
VITE_PAYPAL_CLIENT_SECRET=your_secret
VITE_PAYPAL_MODE=sandbox  # or 'production'
```

## Code Examples

### Using the Tip Jar Hook
```typescript
import { useTipJar } from './hooks/useTipJar';

const tipJar = useTipJar({
  onSuccess: (amount) => console.log(`Got $${amount}`),
  onError: (error) => console.error(error),
});

// Open tip jar
<button onClick={tipJar.open}>Tip</button>

// Check status
{tipJar.isProcessing && 'Processing...'}
{tipJar.error && <div>{tipJar.error}</div>}
```

### Direct PayPal Client Usage
```typescript
import { paypalClient } from './services/paypal.client';

// Initialize once at app start
paypalClient.initialize();

// Create order
const order = await paypalClient.createTipOrder(5.00, 'Thank you!');

// Capture order
const result = await paypalClient.captureTipOrder(order.orderId);
```

### Customize Preset Amounts
```typescript
// src/app/app.tsx
const presetTipOptions = [1, 3, 5, 10, 25, 50]; // Edit these
```

## API Quick Reference

### `useTipJar` Returns
```typescript
{
  isOpen: boolean           // Modal state
  isProcessing: boolean     // Processing payment
  error: string | null      // Error message
  selectedAmount: number    // Selected preset
  customAmount: string      // Custom amount input
  message: string          // Optional message
  open()                   // Open modal
  close()                  // Close modal
  submitTip()              // Submit payment
  isPayPalAvailable        // PayPal configured?
}
```

### `paypalClient` Methods
```typescript
initialize()                                    // Setup
isAvailable(): boolean                         // Check config
createTipOrder(amount, message?): Promise<Order>
captureTipOrder(orderId): Promise<Result>
verifyOrder(orderId): Promise<Status>
```

## Routes
```
/                     → Main app
/payment/success      → Payment successful
/payment/cancel       → Payment cancelled
```

## File Structure
```
src/app/
├── config/paypal.config.ts        # Configuration
├── services/
│   ├── paypal.types.ts           # TypeScript types
│   ├── paypal.service.ts         # Core service
│   └── paypal.client.ts          # Client wrapper
├── hooks/useTipJar.ts            # React hook
└── components/
    ├── PaymentSuccess.tsx         # Success page
    └── PaymentCancel.tsx          # Cancel page
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Tips are simulated" | Add `.env.local` with credentials |
| Authentication failed | Verify Client ID/Secret, restart server |
| CORS errors | Check PayPal API status, verify endpoints |
| Redirect fails | Check return URLs match your domain |

## Testing Checklist
```
☐ Tip jar opens/closes
☐ Presets work
☐ Custom amount works
☐ Validation works (>0)
☐ PayPal redirect works
☐ Success page shows
☐ Cancel page works
☐ Simulation mode works
```

## Security Notes

⚠️ **Development Only**: Current implementation exposes secrets in frontend

✅ **Production**: Move PayPal calls to secure backend

📖 **Read**: [docs/PAYPAL_SECURITY.md](./PAYPAL_SECURITY.md)

## Useful Links

- [Full Integration Guide](./PAYPAL_INTEGRATION.md)
- [Security Guide](./PAYPAL_SECURITY.md)
- [PayPal Dev Portal](https://developer.paypal.com/)
- [PayPal API Docs](https://developer.paypal.com/docs/api/)

## Support

Questions? Check:
1. Browser console for errors
2. Network tab for failed requests  
3. PayPal API status page
4. Project documentation

---
**Quick Start**: Get credentials → Configure `.env.local` → Test with sandbox
