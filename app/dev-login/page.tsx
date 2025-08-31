'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DevLoginPage() {
  const [email, setEmail] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Check if we should show this page
  const isDev = process.env.NODE_ENV !== 'production' || 
               process.env.NEXT_PUBLIC_EMAIL_SERVICE_ENABLED !== 'true';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMagicLink('');
    setCopied(false);
    
    try {
      const response = await fetch(`/api/auth/dev-login?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok) {
        setMagicLink(data.magicLink);
        toast.success('Magic link generated!');
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (error) {
      toast.error('Failed to generate magic link');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };
  
  const goToLink = () => {
    window.location.href = magicLink;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Development Login</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 text-amber-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Email service not configured - Manual login mode</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Magic Link'}
            </Button>
          </form>
          
          {magicLink && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Magic Link Generated!</span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-2 bg-white rounded border break-all text-xs font-mono">
                    {magicLink}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    
                    <Button
                      onClick={goToLink}
                      size="sm"
                      className="flex-1"
                    >
                      Go to Link
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>This link will expire in 1 hour.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}