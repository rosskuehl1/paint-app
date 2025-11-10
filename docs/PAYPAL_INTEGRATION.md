# PayPal Integration Guide

## Overview

PaintApp includes a fully integrated PayPal payment system for accepting tips and donations. This guide covers setup, usage, and customization.

## Features

- ✅ **Secure Payment Processing**: Integration with PayPal's API
- ✅ **Sandbox & Production Support**: Easy switching between test and live modes
- ✅ **Preset & Custom Amounts**: Users can choose from presets or enter custom amounts
- ✅ **Optional Messages**: Users can include a message with their tip
- ✅ **Success/Cancel Pages**: Professional payment flow with proper feedback
- ✅ **Loading States**: Visual feedback during payment processing
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Fallback Mode**: Works in simulation mode without PayPal configured
- ✅ **Checkout Prefetching**: Prepares PayPal redirect in advance for faster tip submissions

## Architecture

### Components

```
src/app/
├── config/
│   └── paypal.config.ts          # PayPal configuration
├── services/
│   ├── paypal.types.ts           # TypeScript types
│   ├── paypal.service.ts         # Core PayPal API service
│   └── paypal.client.ts          # Client-side wrapper
├── hooks/
│   └── useTipJar.ts              # React hook for tip jar
├── components/
│   ├── PaymentSuccess.tsx        # Success page
│   ├── PaymentCancel.tsx         # Cancel page
│   ├── payment-success.module.css
│   └── payment-cancel.module.css
└── app.tsx                        # Main app with tip jar UI
```

### Data Flow

```
1. User opens tip jar → useTipJar hook manages state
2. User enters amount → Validation happens
3. User submits → PayPal order created
4. Redirect to PayPal → User approves payment
5. Return to app → Order captured
6. Success page → Payment confirmed
```

## Setup Instructions

### 1. PayPal Developer Account

1. Go to [PayPal Developer Portal](https://developer.paypal.com/)
2. Sign up or log in
3. Navigate to **Dashboard → My Apps & Credentials**
4. Click **Create App**
5. Name your app (e.g., "PaintApp Tips")
6. Copy your **Client ID** and **Secret**

### 2. Environment Configuration

Create `.env.local` in the project root:

```env
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_client_id_here
VITE_PAYPAL_CLIENT_SECRET=your_secret_here
VITE_PAYPAL_MODE=sandbox
VITE_PAYPAL_RECIPIENT_EMAIL=your_paypal_email@example.com
# Optional: surface a Cash App link alongside PayPal
VITE_CASHAPP_HANDLE=YourCashTagWithoutDollar
```

**Important**: Never commit `.env.local` to version control!

### 3. Sandbox Testing

#### Create Test Accounts

1. In PayPal Developer Dashboard, go to **Sandbox → Accounts**
2. Create a **Personal** account (buyer)
3. Create a **Business** account (seller)
4. Note the credentials for both accounts

#### Test Payment Flow

1. Start your development server: `npm run dev`
2. Click the **Tip Jar** button
3. Enter an amount and submit
4. Log in with your **sandbox buyer account**
5. Complete the payment
6. Verify the success page shows

### 4. Going Live

When ready for production:

1. Update `.env.production`:
   ```env
   VITE_PAYPAL_CLIENT_ID=your_production_client_id
   VITE_PAYPAL_CLIENT_SECRET=your_production_secret
   VITE_PAYPAL_MODE=production
  VITE_PAYPAL_RECIPIENT_EMAIL=your_paypal_email@example.com
  VITE_CASHAPP_HANDLE=YourCashTagWithoutDollar
   ```

2. ⚠️ **Security Note**: For production, consider moving secrets to a backend service (see [PAYPAL_SECURITY.md](./PAYPAL_SECURITY.md))

## Usage

### Basic Integration

The tip jar is already integrated into the main App component. Key features:

```typescript
// In your component
import { useTipJar } from './hooks/useTipJar';

const tipJar = useTipJar({
  onSuccess: (amount, message) => {
    console.log(`Received $${amount} tip`);
  },
  onError: (error) => {
    console.error('Payment error:', error);
  },
});

// Open tip jar
<button onClick={tipJar.open}>Support Us</button>

// Check if PayPal is configured
{tipJar.isPayPalAvailable ? 'PayPal Ready' : 'Simulation Mode'}
```

### Customizing Preset Amounts

Edit `src/app/app.tsx`:

```typescript
const presetTipOptions = [3, 5, 10, 25]; // Change these values
```

### Customizing UI

The tip jar styling is in `src/app/app.module.css`. Key classes:

- `.tipJarOverlay` - Modal backdrop
- `.tipJarCard` - Modal content
- `.tipPresetButton` - Preset amount buttons
- `.tipInput` - Custom amount input
- `.tipSubmitButton` - Submit button

### Payment Success/Cancel Pages

Customize the pages in:
- `src/app/components/PaymentSuccess.tsx`
- `src/app/components/PaymentCancel.tsx`

## API Reference

### `useTipJar` Hook

```typescript
interface UseTipJarOptions {
  onSuccess?: (amount: number, message?: string) => void;
  onError?: (error: Error) => void;
}

interface UseTipJarResult {
  isOpen: boolean;              // Modal open state
  isProcessing: boolean;        // Payment in progress
  error: string | null;         // Error message
  prefetchError: string | null; // Prefetch error message
  isPrefetching: boolean;       // Preparing PayPal checkout
  isCheckoutReady: boolean;     // Prefetched order is ready
  currentAmount: number | null; // Normalized amount in USD
  selectedAmount: number | null; // Selected preset
  customAmount: string;         // Custom amount input
  message: string;              // Optional message
  open: () => void;             // Open modal
  close: () => void;            // Close modal
  setSelectedAmount: (amount: number | null) => void;
  setCustomAmount: (amount: string) => void;
  setMessage: (message: string) => void;
  submitTip: () => Promise<void>; // Submit payment
  isPayPalAvailable: boolean;   // PayPal configured?
}
```

### `PayPalService` Class

```typescript
class PayPalService {
  constructor(config: PayPalConfig);
  
  // Create a new order
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;
  
  // Capture an approved order
  captureOrder(request: CaptureOrderRequest): Promise<CaptureOrderResponse>;
  
  // Verify order status
  verifyOrder(orderId: string): Promise<{ status: string; amount?: number }>;
}
```

### `paypalClient` Singleton

```typescript
import { paypalClient } from './services/paypal.client';

// Initialize (call once at app startup)
paypalClient.initialize();

// Check availability
if (paypalClient.isAvailable()) {
  // PayPal is configured
}

// Create tip order
const order = await paypalClient.createTipOrder(5.00, 'Thanks!');

// Capture order
const result = await paypalClient.captureTipOrder(orderId);
```

## Troubleshooting

### PayPal Not Configured

**Symptom**: Tip jar shows "Tips are simulated"

**Solution**: 
1. Verify `.env.local` exists with correct credentials
2. Restart development server
3. Check browser console for initialization errors

### Authentication Errors

**Symptom**: "Failed to authenticate with PayPal"

**Solution**:
1. Verify Client ID and Secret are correct
2. Check `VITE_PAYPAL_MODE` matches your credentials (sandbox vs production)
3. Ensure credentials haven't expired

### Order Creation Fails

**Symptom**: Error when submitting tip

**Solution**:
1. Check amount is valid (>0)
2. Verify network connectivity
3. Check PayPal API status
4. Review browser console for detailed errors

### Redirect Issues

**Symptom**: Payment doesn't redirect back to app

**Solution**:
1. Verify return URLs in PayPal service match your domain
2. Check `window.location.origin` is correct
3. Ensure routes are configured in `main.tsx`

### CORS Errors

**Symptom**: Cross-origin errors in browser

**Solution**:
- PayPal API calls should work cross-origin
- If using a backend proxy, ensure CORS is configured
- Check network tab for blocked requests

## Testing Checklist

- [ ] Tip jar opens and closes properly
- [ ] Preset amounts can be selected
- [ ] Custom amount can be entered
- [ ] Amount validation works (must be > 0)
- [ ] Message field is optional
- [ ] Submit button shows loading state
- [ ] PayPal redirect happens
- [ ] Payment can be approved in sandbox
- [ ] Success page shows with correct amount
- [ ] Cancel redirects to cancel page
- [ ] Return to app works from both pages
- [ ] Simulation mode works without PayPal

## Best Practices

### 1. User Experience

- **Clear Messaging**: Inform users payments are secure via PayPal
- **Loading States**: Show feedback during processing
- **Error Messages**: Provide helpful error messages
- **Success Confirmation**: Thank users for their support

### 2. Security

- **Never Log Secrets**: Don't log PayPal credentials
- **Validate Inputs**: Always validate amounts server-side (if using backend)
- **Use HTTPS**: Only allow payments over secure connections
- **Monitor Transactions**: Keep logs for audit purposes

### 3. Performance

- **Cache Tokens**: The service caches access tokens automatically
- **Minimize API Calls**: Batch operations when possible
- **Handle Errors Gracefully**: Provide fallback UI

### 4. Accessibility

- **Keyboard Navigation**: Tip jar is keyboard accessible
- **Screen Readers**: ARIA labels are included
- **Focus Management**: Focus is managed in modal

## Advanced Customization

### Adding Recurring Payments

To add subscription support:

1. Update PayPal service to use subscriptions API
2. Modify order creation to include subscription plan
3. Add subscription management UI

### Adding Multiple Currencies

```typescript
// In paypal.config.ts
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];

// In your component
const [currency, setCurrency] = useState('USD');

// Pass currency to order creation
await paypalClient.createTipOrder(amount, message);
```

### Webhooks for Backend Verification

See [PAYPAL_SECURITY.md](./PAYPAL_SECURITY.md) for webhook implementation.

## Support & Resources

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [PayPal API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Sandbox Guide](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Project Security Guide](./PAYPAL_SECURITY.md)

## Contributing

To improve the PayPal integration:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This PayPal integration is part of PaintApp and follows the same MIT license.
