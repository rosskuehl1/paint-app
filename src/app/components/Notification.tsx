import styles from '../app.module.css';

interface NotificationProps {
  message: string;
}

export function Notification({ message }: NotificationProps) {
  return <div className={styles.notification}>{message}</div>;
}
