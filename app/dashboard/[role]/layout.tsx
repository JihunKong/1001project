import WriterLNB from '@/components/figma/layout/WriterLNB';
import GlobalNavigationBar from '@/components/figma/layout/GlobalNavigationBar';

export default async function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <WriterLNB role={role} />
      <GlobalNavigationBar />

      <div className="lg:ml-60 pt-[80px]">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
