import { useEffect, useState } from 'react';
import { paypalClient } from '../services/paypal.client';
import styles from './payment-success.module.css';

/**
 * Payment Success Page
 * Handles PayPal order capture after user approval
 */
export function PaymentSuccess() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const captureOrder = async () => {
      try {
        // Get order ID from URL
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('token');

        if (!orderId) {
          setStatus('error');
          setMessage('Invalid payment session');
          return;
        }

        // Capture the order
        const result = await paypalClient.captureTipOrder(orderId);

        if (result.status === 'COMPLETED') {
          setStatus('success');
          setMessage(`Thank you for your ${result.amount ? `$${result.amount.toFixed(2)}` : ''} tip! 🎉`);

          // Redirect back to app after 3 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Payment could not be completed. Please try again.');
        }
      } catch (error) {
        console.error('Payment capture error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment.');
      }
    };

    captureOrder();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'processing' && (
          <>
            <div className={styles.spinner} />
            <h1 className={styles.title}>{message}</h1>
            <p className={styles.subtitle}>Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>{message}</h1>
            <p className={styles.subtitle}>Your support means a lot!</p>
            <p className={styles.info}>Redirecting you back to PaintApp...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✗</div>
            <h1 className={styles.title}>{message}</h1>
            <p className={styles.subtitle}>No charges have been made.</p>
            <button
              className={styles.button}
              onClick={() => (window.location.href = '/')}
            >
              Return to PaintApp
            </button>
          </>
        )}
      </div>
    </div>
  );
}
