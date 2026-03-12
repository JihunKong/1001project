'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = () => onClose();
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full max-w-2xl max-h-[80vh] rounded-2xl p-0 backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl sticky top-0">
          <h2 className="text-lg font-bold text-gray-900">
            {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed">
          {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#91C549] text-white rounded-lg font-medium hover:bg-[#7AB339] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

function TermsContent() {
  return (
    <div className="space-y-4">
      <p className="font-semibold">Last updated: March 2026</p>

      <h3 className="font-bold text-base">1. Acceptance of Terms</h3>
      <p>By accessing or using 1001 Stories (&quot;the Platform&quot;), operated by Seeds of Empowerment, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>

      <h3 className="font-bold text-base">2. Description of Service</h3>
      <p>1001 Stories is an educational platform that discovers, publishes, and shares stories from children in underserved communities. The Platform provides reading materials, educational tools, and community features for learners, educators, writers, and institutions.</p>

      <h3 className="font-bold text-base">3. User Accounts</h3>
      <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials. Users under 13 require parental consent per COPPA regulations.</p>

      <h3 className="font-bold text-base">4. Acceptable Use</h3>
      <p>You agree not to: upload harmful or inappropriate content; attempt unauthorized access; use the Platform for commercial purposes without permission; violate any applicable laws or regulations.</p>

      <h3 className="font-bold text-base">5. Content and Intellectual Property</h3>
      <p>Stories and content submitted by users remain the intellectual property of their authors. By submitting content, you grant 1001 Stories a non-exclusive license to publish, distribute, and display the content for educational purposes. All Platform code, design, and branding are owned by Seeds of Empowerment.</p>

      <h3 className="font-bold text-base">6. Privacy</h3>
      <p>Your use of the Platform is also governed by our Privacy Policy. We are committed to protecting your personal information and complying with applicable data protection laws.</p>

      <h3 className="font-bold text-base">7. Disclaimer</h3>
      <p>The Platform is provided &quot;as is&quot; without warranties of any kind. Seeds of Empowerment is not liable for any damages arising from your use of the Platform.</p>

      <h3 className="font-bold text-base">8. Changes to Terms</h3>
      <p>We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified terms.</p>

      <h3 className="font-bold text-base">9. Contact</h3>
      <p>Questions about these terms? Contact us at <a href="mailto:info@seedsofempowerment.org" className="text-blue-600 underline">info@seedsofempowerment.org</a>.</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4">
      <p className="font-semibold">Last updated: March 2026</p>

      <h3 className="font-bold text-base">1. Information We Collect</h3>
      <p>We collect information you provide directly: name, email address, role, and content you submit. We also collect usage data such as pages visited, features used, and device information through cookies and similar technologies.</p>

      <h3 className="font-bold text-base">2. How We Use Your Information</h3>
      <p>We use your information to: provide and improve the Platform; personalize your experience; communicate with you; ensure safety and security; comply with legal obligations.</p>

      <h3 className="font-bold text-base">3. Children&apos;s Privacy (COPPA)</h3>
      <p>We comply with COPPA. We do not knowingly collect personal information from children under 13 without parental consent. Parents can request deletion of their child&apos;s data at any time.</p>

      <h3 className="font-bold text-base">4. Data Sharing</h3>
      <p>We do not sell your personal information. We may share data with: service providers who help operate the Platform; law enforcement when required by law; educational partners with your consent.</p>

      <h3 className="font-bold text-base">5. Data Security</h3>
      <p>We implement appropriate security measures including encryption, access controls, and regular security assessments. However, no method of transmission over the Internet is 100% secure.</p>

      <h3 className="font-bold text-base">6. Your Rights</h3>
      <p>You have the right to: access your personal data; correct inaccurate data; delete your account and data; opt out of marketing communications; data portability.</p>

      <h3 className="font-bold text-base">7. Cookies</h3>
      <p>We use essential cookies for authentication and session management. Analytics cookies help us understand usage patterns. You can control cookie preferences through your browser settings.</p>

      <h3 className="font-bold text-base">8. International Data Transfers</h3>
      <p>Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws including GDPR and PIPA.</p>

      <h3 className="font-bold text-base">9. Contact</h3>
      <p>For privacy-related inquiries, contact us at <a href="mailto:info@seedsofempowerment.org" className="text-blue-600 underline">info@seedsofempowerment.org</a>.</p>
    </div>
  );
}
