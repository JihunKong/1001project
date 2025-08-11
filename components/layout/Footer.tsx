'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation('common');
  
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold gradient-text">1001 Stories</span>
            </Link>
            <p className="text-sm text-gray-600 mb-4">
              Empowering young voices and inspiring the world through stories.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('footer.about')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mission" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.mission')}
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.team')}
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.partners')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Programs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Programs</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/programs/esl" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  ESL Program
                </Link>
              </li>
              <li>
                <Link href="/programs/mentorship" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Mentorship
                </Link>
              </li>
              <li>
                <Link href="/programs/workshops" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Workshops
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('footer.contact')}</h3>
            <div className="space-y-2">
              <a href="mailto:info@1001stories.org" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="h-4 w-4" />
                info@1001stories.org
              </a>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Contact Form
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}