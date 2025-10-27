'use client';

interface StoryContentViewerProps {
  title: string;
  content: string;
}

export default function StoryContentViewer({ title, content }: StoryContentViewerProps) {
  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-10 flex-1 max-h-[656px] flex flex-col relative">
      <div className="space-y-4 flex-1 overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-[#F2F2F7] scrollbar-track-transparent">
        <h2
          className="text-[#141414] break-words"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '1.221'
          }}
        >
          {title}
        </h2>

        <div
          className="prose prose-slate max-w-none text-[#141414] break-words"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.193'
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
