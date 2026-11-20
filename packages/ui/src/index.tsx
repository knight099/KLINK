import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { hindi, type Message } from './messages';

export type { Message } from './messages';

type Language = 'en' | 'hi';
const storageKey = 'klink-language';

function initialLanguage(): Language {
  try {
    return localStorage.getItem(storageKey) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // The current page remains bilingual when storage is unavailable.
    }
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  const { language, setLanguage } = context;
  const t = (message: Message) => language === 'hi' ? hindi[message] : message;
  return { language, setLanguage, t };
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="klink-language" role="group" aria-label={t('Language')}>
      <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
        English
      </button>
      <button type="button" lang="hi" aria-pressed={language === 'hi'} onClick={() => setLanguage('hi')}>
        हिन्दी
      </button>
    </div>
  );
}

export function PageHeader({ children }: { children: ReactNode }) {
  return <header className="klink-header">{children}</header>;
}

export function FormNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className="klink-notice" role={error ? 'alert' : 'status'}>{children}</div>;
}

const orderStatuses: Record<string, Message> = {
  PENDING: 'Awaiting confirmation',
  PENDING_APPROVAL: 'Awaiting confirmation',
  PREPARING: 'Preparing',
  COMPLETED: 'Completed',
  CONFIRMED: 'Confirmed',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Declined',
};

export function OrderStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const message = orderStatuses[status];
  return <>{message ? t(message) : status}</>;
}

const paymentStatuses: Record<string, Message> = {
  PENDING: 'Payment due',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  UDHAAR: 'Udhaar',
};

export function PaymentStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const message = paymentStatuses[status];
  return <>{message ? t(message) : status}</>;
}

export type FormFailure = { message?: string; status?: number; fallback: Message };

export function signInFailure(error: unknown): FormFailure {
  const message = error instanceof Error ? error.message : undefined;
  const status = error instanceof Error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;
  const fallback = status === 401
    ? 'Invalid mobile number or password'
    : status === 403
    ? 'This account cannot sign in to this app.'
    : 'Could not sign in. Try again.';
  return { message, status, fallback };
}

export function FormError({ failure }: { failure: FormFailure }) {
  const { language, t } = useLanguage();
  const { message, status, fallback } = failure;
  const localized = status === 429
    ? 'Too many attempts. Wait before trying again.'
    : fallback;

  return <FormNotice error>{language === 'en' && message ? message : t(localized)}</FormNotice>;
}

export function SignInDialog({ children, titleId, onDismiss }: {
  children: ReactNode;
  titleId: string;
  onDismiss?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss?.();
      }}
      className="klink-auth"
    >
      {children}
    </dialog>
  );
}

type YardDeliveryWindow = { startsAt: string; endsAt: string };
export type YardDeliverySchedule = {
  requested: YardDeliveryWindow;
  confirmed?: YardDeliveryWindow;
  proposed?: YardDeliveryWindow;
  respondBy: string;
  events?: Array<{ type: 'PROPOSED' | 'BUYER_APPROVED' | 'YARD_CONFIRMED'; at: string; window: YardDeliveryWindow }>;
};

export function YardDeliveryDetails({ schedule }: { schedule: YardDeliverySchedule }) {
  const { t, language } = useLanguage();
  const format = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });
  const show = (window: YardDeliveryWindow) => `${format.format(new Date(window.startsAt))} – ${format.format(new Date(window.endsAt))}`;
  const eventLabel = {
    PROPOSED: 'Proposed delivery window',
    BUYER_APPROVED: 'Approve delivery window',
    YARD_CONFIRMED: 'Confirmed delivery window'
  } as const;
  return (
    <div className="space-y-2">
      <p>{t(schedule.confirmed ? 'Confirmed delivery window' : 'Estimated delivery window')}: {show(schedule.confirmed || schedule.requested)} IST</p>
      {schedule.proposed && <p>{t('Proposed delivery window')}: {show(schedule.proposed)} IST</p>}
      {!!schedule.events?.length && (
        <details>
          <summary>{t('Delivery changes')}</summary>
          <ol className="space-y-1">
            {schedule.events.map((event, index) => (
              <li key={index}>{format.format(new Date(event.at))} · {t(eventLabel[event.type])}: {show(event.window)} IST</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
