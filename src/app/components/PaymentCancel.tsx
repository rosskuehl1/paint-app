import styles from './payment-cancel.module.css';

/**
 * Payment Cancel Page
 * Shown when user cancels PayPal payment
 */
export function PaymentCancel() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>↩</div>
        <h1 className={styles.title}>Payment Cancelled</h1>
        <p className={styles.subtitle}>
          You cancelled the payment. No charges have been made.
        </p>
        <p className={styles.info}>
          Feel free to try again anytime you'd like to support PaintApp!
        </p>
        <button
          className={styles.button}
          onClick={() => (window.location.href = '/')}
        >
          Return to PaintApp
        </button>
      </div>
    </div>
  );
}
