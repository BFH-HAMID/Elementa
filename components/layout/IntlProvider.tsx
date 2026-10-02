'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';

export function IntlProvider({ locale, messages, children }: { locale: string; messages: AbstractIntlMessages; children: ReactNode }) {
  return <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>;
}
