import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { paypalClient } from '../services/paypal.client';
import type { CreateOrderResponse } from '../services/paypal.types';

interface UseTipJarOptions {
  onSuccess?: (amount: number, message?: string) => void;
  onError?: (error: Error) => void;
}

interface UseTipJarResult {
  isOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  prefetchError: string | null;
  isPrefetching: boolean;
  isCheckoutReady: boolean;
  currentAmount: number | null;
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
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  const [selectedAmountState, setSelectedAmountState] = useState<number | null>(5);
  const [customAmountState, setCustomAmountState] = useState('');
  const [messageState, setMessageState] = useState('');
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchedOrder, setPrefetchedOrder] = useState<CreateOrderResponse | null>(null);

  const isPayPalAvailable = paypalClient.isAvailable();
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchKeyRef = useRef<string | null>(null);
  const prefetchRequestIdRef = useRef(0);

  const selectedAmount = selectedAmountState;
  const customAmount = customAmountState;
  const message = messageState;

  const normalizedAmount = useMemo(() => {
    const trimmedCustom = customAmount.trim();
    const amountCandidate = trimmedCustom !== '' ? Number.parseFloat(trimmedCustom) : selectedAmount;

    if (amountCandidate === null || Number.isNaN(amountCandidate) || amountCandidate <= 0) {
      return null;
    }

    return Math.round(amountCandidate * 100) / 100;
  }, [customAmount, selectedAmount]);

  const trimmedMessage = useMemo(() => message.trim(), [message]);

  const isCheckoutReady = useMemo(() => {
    if (!prefetchedOrder || normalizedAmount === null) {
      return false;
    }

    const expectedKey = `${normalizedAmount}-${trimmedMessage}`;
    return prefetchKeyRef.current === expectedKey;
  }, [prefetchedOrder, normalizedAmount, trimmedMessage]);

  const resetPrefetchState = useCallback(() => {
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    prefetchKeyRef.current = null;
    prefetchRequestIdRef.current += 1;
    setPrefetchedOrder(null);
    setIsPrefetching(false);
    setPrefetchError(null);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedAmountState(5);
    setCustomAmountState('');
    setMessageState('');
    setError(null);
    setPrefetchError(null);
    resetPrefetchState();
  }, [resetPrefetchState]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedAmountState(5);
    setCustomAmountState('');
    setMessageState('');
    setError(null);
    setIsProcessing(false);
    setPrefetchError(null);
    resetPrefetchState();
  }, [resetPrefetchState]);

  const setSelectedAmount = useCallback((amount: number | null) => {
    setSelectedAmountState(amount);
    setError(null);
    setPrefetchError(null);
  }, []);

  const setCustomAmount = useCallback((amount: string) => {
    setCustomAmountState(amount);
    setError(null);
    setPrefetchError(null);
  }, []);

  const setMessage = useCallback((value: string) => {
    setMessageState(value);
    setPrefetchError(null);
  }, []);

  useEffect(() => {
    if (!isOpen || !isPayPalAvailable) {
      resetPrefetchState();
      return;
    }

    if (normalizedAmount === null) {
      resetPrefetchState();
      return;
    }

    const prefetchKey = `${normalizedAmount}-${trimmedMessage}`;
    if (prefetchKeyRef.current === prefetchKey && prefetchedOrder) {
      return;
    }

    const controller = new AbortController();
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = controller;

    setIsPrefetching(true);
    setPrefetchError(null);
    prefetchRequestIdRef.current += 1;
    const requestId = prefetchRequestIdRef.current;

    const timeoutId = window.setTimeout(async () => {
      try {
        const order = await paypalClient.createTipOrder(normalizedAmount, trimmedMessage, { signal: controller.signal });

        if (controller.signal.aborted || prefetchRequestIdRef.current !== requestId) {
          return;
        }

        if (!order.approvalUrl) {
          throw new Error('Failed to prepare PayPal checkout.');
        }

        prefetchKeyRef.current = prefetchKey;
        setPrefetchedOrder(order);
        setIsPrefetching(false);
        setPrefetchError(null);
      } catch (err) {
        if (controller.signal.aborted || prefetchRequestIdRef.current !== requestId) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to prepare PayPal checkout.';
        setPrefetchedOrder(null);
        setIsPrefetching(false);
        setPrefetchError(errorMessage);
      }
    }, 350);

    return () => {
      controller.abort();
      if (prefetchAbortRef.current === controller) {
        prefetchAbortRef.current = null;
      }
      window.clearTimeout(timeoutId);
      setIsPrefetching(false);
    };
  }, [isOpen, isPayPalAvailable, normalizedAmount, trimmedMessage, prefetchedOrder, resetPrefetchState]);

  const submitTip = useCallback(async () => {
    try {
      setError(null);
      setPrefetchError(null);

      if (normalizedAmount === null) {
        setError('Enter a valid tip amount greater than zero.');
        return;
      }

      setIsProcessing(true);
      const tipMessage = trimmedMessage;
      const prefetchKey = `${normalizedAmount}-${tipMessage}`;

      // If PayPal is available, create an order and redirect
      if (isPayPalAvailable) {
        let orderToUse: CreateOrderResponse | null = null;

        if (prefetchedOrder && prefetchKeyRef.current === prefetchKey) {
          orderToUse = prefetchedOrder;
        }

        if (!orderToUse) {
          orderToUse = await paypalClient.createTipOrder(normalizedAmount, tipMessage);
        }

        if (orderToUse.approvalUrl) {
          prefetchKeyRef.current = null;
          setPrefetchedOrder(null);
          window.location.href = orderToUse.approvalUrl;
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
  }, [normalizedAmount, trimmedMessage, isPayPalAvailable, prefetchedOrder, options, close]);

  return {
    isOpen,
    isProcessing,
    error,
    prefetchError,
    isPrefetching,
    currentAmount: normalizedAmount,
    isCheckoutReady,
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
