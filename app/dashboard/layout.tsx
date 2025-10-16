import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - 1001 Stories',
  description: 'Role-based dashboard for 1001 Stories platform',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}