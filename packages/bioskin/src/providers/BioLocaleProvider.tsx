/**
 * BioLocaleProvider - i18n context provider for BioSkin
 *
 * Sprint E3: Enterprise i18n Foundation
 * Provides locale-aware formatting for dates, numbers, and currencies.
 *
 * @example
 * // Basic usage
 * <BioLocaleProvider locale="en-US">
 *   <App />
 * </BioLocaleProvider>
 *
 * @example
 * // Full configuration
 * <BioLocaleProvider
 *   locale="de-DE"
 *   timezone="Europe/Berlin"
 *   currency="EUR"
 * >
 *   <App />
 * </BioLocaleProvider>
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface BioLocaleConfig {
  /** BCP 47 locale tag (e.g., 'en-US', 'de-DE', 'zh-CN') */
  locale: string;
  /** IANA timezone (e.g., 'America/New_York', 'Europe/London') */
  timezone: string;
  /** ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP') */
  currency: string;
  /** First day of week (0 = Sunday, 1 = Monday) */
  weekStartsOn: 0 | 1;
  /** Date format style */
  dateStyle: 'full' | 'long' | 'medium' | 'short';
  /** Time format style */
  timeStyle: 'full' | 'long' | 'medium' | 'short';
  /** Number format options */
  numberFormat: {
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    useGrouping: boolean;
  };
}

export interface BioLocaleContextValue extends BioLocaleConfig {
  /** Format a date according to locale */
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a time according to locale */
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a date and time according to locale */
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a relative time (e.g., '2 days ago') */
  formatRelativeTime: (date: Date | string | number) => string;
  /** Format a number according to locale */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Format a currency value */
  formatCurrency: (value: number, currency?: string) => string;
  /** Format a percentage */
  formatPercent: (value: number, decimals?: number) => string;
  /** Parse a locale date string to Date */
  parseDate: (dateString: string) => Date | null;
  /** Convert a date to the configured timezone */
  toTimezone: (date: Date | string | number) => Date;
  /** Get day names for current locale */
  getDayNames: (format?: 'long' | 'short' | 'narrow') => string[];
  /** Get month names for current locale */
  getMonthNames: (format?: 'long' | 'short' | 'narrow') => string[];
  /** Check if locale is RTL */
  isRTL: boolean;
  /** Update locale config */
  setLocaleConfig: (config: Partial<BioLocaleConfig>) => void;
}

// ============================================================
// Default Config
// ============================================================

const DEFAULT_CONFIG: BioLocaleConfig = {
  locale: 'en-US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  currency: 'USD',
  weekStartsOn: 0,
  dateStyle: 'medium',
  timeStyle: 'short',
  numberFormat: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  },
};

// RTL locales
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd']);

// ============================================================
// Context
// ============================================================

const BioLocaleContext = React.createContext<BioLocaleContextValue | null>(null);

// ============================================================
// Provider Props
// ============================================================

export interface BioLocaleProviderProps {
  children: React.ReactNode;
  /** BCP 47 locale tag */
  locale?: string;
  /** IANA timezone */
  timezone?: string;
  /** ISO 4217 currency code */
  currency?: string;
  /** First day of week */
  weekStartsOn?: 0 | 1;
  /** Date format style */
  dateStyle?: BioLocaleConfig['dateStyle'];
  /** Time format style */
  timeStyle?: BioLocaleConfig['timeStyle'];
}

// ============================================================
// Provider Component
// ============================================================

export function BioLocaleProvider({
  children,
  locale = DEFAULT_CONFIG.locale,
  timezone = DEFAULT_CONFIG.timezone,
  currency = DEFAULT_CONFIG.currency,
  weekStartsOn = DEFAULT_CONFIG.weekStartsOn,
  dateStyle = DEFAULT_CONFIG.dateStyle,
  timeStyle = DEFAULT_CONFIG.timeStyle,
}: BioLocaleProviderProps) {
  const [config, setConfig] = React.useState<BioLocaleConfig>({
    ...DEFAULT_CONFIG,
    locale,
    timezone,
    currency,
    weekStartsOn,
    dateStyle,
    timeStyle,
  });

  // Update config when props change
  React.useEffect(() => {
    setConfig(prev => ({
      ...prev,
      locale,
      timezone,
      currency,
      weekStartsOn,
      dateStyle,
      timeStyle,
    }));
  }, [locale, timezone, currency, weekStartsOn, dateStyle, timeStyle]);

  // Memoized formatters
  const dateFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(config.locale, {
      dateStyle: config.dateStyle,
      timeZone: config.timezone,
    }),
    [config.locale, config.dateStyle, config.timezone]
  );

  const timeFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(config.locale, {
      timeStyle: config.timeStyle,
      timeZone: config.timezone,
    }),
    [config.locale, config.timeStyle, config.timezone]
  );

  const dateTimeFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(config.locale, {
      dateStyle: config.dateStyle,
      timeStyle: config.timeStyle,
      timeZone: config.timezone,
    }),
    [config.locale, config.dateStyle, config.timeStyle, config.timezone]
  );

  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat(config.locale, config.numberFormat),
    [config.locale, config.numberFormat]
  );

  const currencyFormatter = React.useMemo(
    () => new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
    }),
    [config.locale, config.currency]
  );

  const relativeTimeFormatter = React.useMemo(
    () => new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' }),
    [config.locale]
  );

  // Helper to ensure Date object
  const toDate = React.useCallback((input: Date | string | number): Date => {
    if (input instanceof Date) return input;
    return new Date(input);
  }, []);

  // Format functions
  const formatDate = React.useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      if (options) {
        return new Intl.DateTimeFormat(config.locale, {
          ...options,
          timeZone: config.timezone,
        }).format(d);
      }
      return dateFormatter.format(d);
    },
    [config.locale, config.timezone, dateFormatter, toDate]
  );

  const formatTime = React.useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      if (options) {
        return new Intl.DateTimeFormat(config.locale, {
          ...options,
          timeZone: config.timezone,
        }).format(d);
      }
      return timeFormatter.format(d);
    },
    [config.locale, config.timezone, timeFormatter, toDate]
  );

  const formatDateTime = React.useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      if (options) {
        return new Intl.DateTimeFormat(config.locale, {
          ...options,
          timeZone: config.timezone,
        }).format(d);
      }
      return dateTimeFormatter.format(d);
    },
    [config.locale, config.timezone, dateTimeFormatter, toDate]
  );

  const formatRelativeTime = React.useCallback(
    (date: Date | string | number): string => {
      const d = toDate(date);
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      const diffWeek = Math.round(diffDay / 7);
      const diffMonth = Math.round(diffDay / 30);
      const diffYear = Math.round(diffDay / 365);

      if (Math.abs(diffSec) < 60) return relativeTimeFormatter.format(diffSec, 'second');
      if (Math.abs(diffMin) < 60) return relativeTimeFormatter.format(diffMin, 'minute');
      if (Math.abs(diffHour) < 24) return relativeTimeFormatter.format(diffHour, 'hour');
      if (Math.abs(diffDay) < 7) return relativeTimeFormatter.format(diffDay, 'day');
      if (Math.abs(diffWeek) < 4) return relativeTimeFormatter.format(diffWeek, 'week');
      if (Math.abs(diffMonth) < 12) return relativeTimeFormatter.format(diffMonth, 'month');
      return relativeTimeFormatter.format(diffYear, 'year');
    },
    [relativeTimeFormatter, toDate]
  );

  const formatNumber = React.useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      if (options) {
        return new Intl.NumberFormat(config.locale, options).format(value);
      }
      return numberFormatter.format(value);
    },
    [config.locale, numberFormatter]
  );

  const formatCurrency = React.useCallback(
    (value: number, currency?: string): string => {
      if (currency && currency !== config.currency) {
        return new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency,
        }).format(value);
      }
      return currencyFormatter.format(value);
    },
    [config.locale, config.currency, currencyFormatter]
  );

  const formatPercent = React.useCallback(
    (value: number, decimals = 0): string => {
      return new Intl.NumberFormat(config.locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },
    [config.locale]
  );

  const parseDate = React.useCallback(
    (dateString: string): Date | null => {
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    },
    []
  );

  const toTimezone = React.useCallback(
    (date: Date | string | number): Date => {
      const d = toDate(date);
      // Create a formatter that outputs in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: config.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const get = (type: string) => parts.find(p => p.type === type)?.value || '0';

      return new Date(
        parseInt(get('year')),
        parseInt(get('month')) - 1,
        parseInt(get('day')),
        parseInt(get('hour')),
        parseInt(get('minute')),
        parseInt(get('second'))
      );
    },
    [config.timezone, toDate]
  );

  const getDayNames = React.useCallback(
    (format: 'long' | 'short' | 'narrow' = 'short'): string[] => {
      const formatter = new Intl.DateTimeFormat(config.locale, { weekday: format });
      const days: string[] = [];
      // Start from a known Sunday (Jan 4, 1970 is a Sunday)
      for (let i = 0; i < 7; i++) {
        days.push(formatter.format(new Date(1970, 0, 4 + i)));
      }
      // Reorder based on weekStartsOn
      if (config.weekStartsOn === 1) {
        days.push(days.shift()!);
      }
      return days;
    },
    [config.locale, config.weekStartsOn]
  );

  const getMonthNames = React.useCallback(
    (format: 'long' | 'short' | 'narrow' = 'long'): string[] => {
      const formatter = new Intl.DateTimeFormat(config.locale, { month: format });
      return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2024, i, 1)));
    },
    [config.locale]
  );

  const isRTL = React.useMemo(() => {
    const lang = config.locale.split('-')[0];
    return RTL_LOCALES.has(lang);
  }, [config.locale]);

  const setLocaleConfig = React.useCallback((newConfig: Partial<BioLocaleConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const value: BioLocaleContextValue = React.useMemo(
    () => ({
      ...config,
      formatDate,
      formatTime,
      formatDateTime,
      formatRelativeTime,
      formatNumber,
      formatCurrency,
      formatPercent,
      parseDate,
      toTimezone,
      getDayNames,
      getMonthNames,
      isRTL,
      setLocaleConfig,
    }),
    [
      config,
      formatDate,
      formatTime,
      formatDateTime,
      formatRelativeTime,
      formatNumber,
      formatCurrency,
      formatPercent,
      parseDate,
      toTimezone,
      getDayNames,
      getMonthNames,
      isRTL,
      setLocaleConfig,
    ]
  );

  return (
    <BioLocaleContext.Provider value={value}>
      {children}
    </BioLocaleContext.Provider>
  );
}

BioLocaleProvider.displayName = 'BioLocaleProvider';

// ============================================================
// Hook
// ============================================================

export function useLocale(): BioLocaleContextValue {
  const context = React.useContext(BioLocaleContext);

  if (!context) {
    // Return default formatters when used outside provider
    // This allows components to work standalone
    const defaultConfig = DEFAULT_CONFIG;

    return {
      ...defaultConfig,
      formatDate: (date) => new Date(date).toLocaleDateString(defaultConfig.locale),
      formatTime: (date) => new Date(date).toLocaleTimeString(defaultConfig.locale),
      formatDateTime: (date) => new Date(date).toLocaleString(defaultConfig.locale),
      formatRelativeTime: (date) => new Date(date).toLocaleDateString(defaultConfig.locale),
      formatNumber: (value) => value.toLocaleString(defaultConfig.locale),
      formatCurrency: (value) => new Intl.NumberFormat(defaultConfig.locale, {
        style: 'currency',
        currency: defaultConfig.currency,
      }).format(value),
      formatPercent: (value) => `${(value * 100).toFixed(0)}%`,
      parseDate: (str) => new Date(str),
      toTimezone: (date) => new Date(date),
      getDayNames: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      getMonthNames: () => [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      isRTL: false,
      setLocaleConfig: () => { },
    };
  }

  return context;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'LOCALE01',
  version: '1.0.0',
  name: 'BioLocaleProvider',
  family: 'PROVIDER',
  purpose: 'I18N',
  poweredBy: 'Intl',
  status: 'active',
} as const;
