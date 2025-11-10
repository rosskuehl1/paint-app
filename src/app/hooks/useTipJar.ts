import { useState, useCallback } from 'react';
import { paypalClient } from '../services/paypal.client';

interface UseTipJarOptions {
  onSuccess?: (amount: number, message?: string) => void;
  onError?: (error: Error) => void;
}

interface UseTipJarResult {
  isOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  selectedAmount: number | null;
  customAmount: string;
  message: string;
  open: () => void;
  close: () => void;
  setSelectedAmount: (amount: number | null) => void;
  setCustomAmount: (amount: string) => void;
  setMessage: (message: string) => void;
  submitTip: () => Promise<void>;
  isPayPalAvailable: boolean;
}

/**
 * Custom hook for managing the tip jar functionality with PayPal integration
 */
export function useTipJar(options: UseTipJarOptions = {}): UseTipJarResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');

  const isPayPalAvailable = paypalClient.isAvailable();

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedAmount(5);
    setCustomAmount('');
    setMessage('');
    setError(null);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedAmount(5);
    setCustomAmount('');
    setMessage('');
    setError(null);
    setIsProcessing(false);
  }, []);

  const submitTip = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // Determine the tip amount
      const trimmedCustom = customAmount.trim();
      const amountCandidate = trimmedCustom !== '' ? Number.parseFloat(trimmedCustom) : selectedAmount;

      if (amountCandidate === null || Number.isNaN(amountCandidate) || amountCandidate <= 0) {
        setError('Enter a valid tip amount greater than zero.');
        setIsProcessing(false);
        return;
      }

      const normalizedAmount = Math.round(amountCandidate * 100) / 100;
      const tipMessage = message.trim();

      // If PayPal is available, create an order and redirect
      if (isPayPalAvailable) {
        const order = await paypalClient.createTipOrder(normalizedAmount, tipMessage);

        if (order.approvalUrl) {
          // Redirect to PayPal for payment
          window.location.href = order.approvalUrl;
        } else {
          throw new Error('Failed to get PayPal approval URL');
        }
      } else {
        // Fallback to simulated tip (for development/testing)
        options.onSuccess?.(normalizedAmount, tipMessage);
        close();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process tip';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      setIsProcessing(false);
    }
  }, [customAmount, selectedAmount, message, isPayPalAvailable, options, close]);

  return {
    isOpen,
    isProcessing,
    error,
    selectedAmount,
    customAmount,
    message,
    open,
    close,
    setSelectedAmount,
    setCustomAmount,
    setMessage,
    submitTip,
    isPayPalAvailable,
  };
}
