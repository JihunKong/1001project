export default function ProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E5E5EA] border-t-[#141414] rounded-full animate-spin" />
        <p className="text-[#8E8E93]" style={{ fontSize: '18px' }}>
          Loading profile...
        </p>
      </div>
    </div>
  );
}
