'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation('common');
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Brand and Social */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6 md:mb-0">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/seeds-of-empowerment-logo.png" 
                alt="Seeds of Empowerment" 
                className="h-12 w-auto"
              />
              <span className="text-xl font-bold text-brand-primary">1001 Stories</span>
            </Link>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-3 md:ml-8">
              <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Essential Links */}
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-brand-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-brand-primary transition-colors">
              Contact Us
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-brand-primary transition-colors">
              About Us
            </Link>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500">
            © 2024 1001 Stories by Seeds of Empowerment. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}