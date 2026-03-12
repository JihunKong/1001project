'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import LegalModal from './LegalModal';

export default function AuthLegalFooter() {
  const { t } = useTranslation();
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleClose = useCallback(() => setModalType(null), []);

  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-xs text-[#737373]">
          {t('auth.common.footer.termsPrefix')}{' '}
          <button
            type="button"
            onClick={() => setModalType('terms')}
            className="text-[#737373] hover:text-[#2B2B2B] underline"
          >
            {t('auth.common.footer.termsLink')}
          </button>
          {' '}{t('auth.common.footer.termsConnector')}{' '}
          <button
            type="button"
            onClick={() => setModalType('privacy')}
            className="text-[#737373] hover:text-[#2B2B2B] underline"
          >
            {t('auth.common.footer.privacyLink')}
          </button>
        </p>
      </div>
      <LegalModal
        isOpen={modalType !== null}
        onClose={handleClose}
        type={modalType || 'terms'}
      />
    </>
  );
}
