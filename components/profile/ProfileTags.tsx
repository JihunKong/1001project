'use client';

interface ProfileTagsProps {
  tags: string[];
}

export function ProfileTags({ tags }: ProfileTagsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 rounded-full bg-[#E5E5EA] text-[#141414]"
          style={{ fontSize: '14px' }}
        >
          {tag.startsWith('#') ? tag : `#${tag}`}
        </span>
      ))}
    </div>
  );
}
