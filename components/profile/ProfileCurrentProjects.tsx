'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: string;
  lastEditedAt: Date;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  summary?: string;
  wordCount?: number;
}

interface ProfileCurrentProjectsProps {
  projects: Project[];
  userRole: string;
}

export default function ProfileCurrentProjects({ projects, userRole }: ProfileCurrentProjectsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { backgroundColor: '#F2F2F7', color: '#141414' };
      case 'NEEDS_REVISION':
        return { backgroundColor: '#FEF2F2', color: '#C2410C' };
      case 'PUBLISHED':
        return { backgroundColor: '#DBEAFE', color: '#1E3A8A' };
      case 'PENDING':
      case 'STORY_REVIEW':
      case 'FORMAT_REVIEW':
      case 'CONTENT_REVIEW':
        return { backgroundColor: '#E0E7FF', color: '#3730A3' };
      case 'APPROVED':
      case 'STORY_APPROVED':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      default:
        return { backgroundColor: '#F2F2F7', color: '#141414' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return t('profile.stats.draft');
      case 'NEEDS_REVISION': return t('profile.stats.needRevision');
      case 'PUBLISHED': return t('profile.stats.published');
      case 'PENDING': return t('profile.stats.submitted');
      case 'STORY_REVIEW':
      case 'FORMAT_REVIEW':
      case 'CONTENT_REVIEW':
        return t('profile.stats.underReview');
      case 'APPROVED':
      case 'STORY_APPROVED':
        return t('profile.stats.approved');
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${month}.${day}.${year} ${hour12}:${minutes} ${ampm}`;
  };

  const handleStartNew = () => {
    if (userRole === 'LEARNER') {
      alert(t('Students cannot create stories'));
      return;
    }
    router.push('/dashboard/writer/submit-text');
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 500,
          lineHeight: '1.221',
          color: '#141414'
        }}>
          {t('profile.currentProjects.title')}
        </h2>
        <button
          onClick={handleStartNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            color: '#141414',
            border: '1px solid #E5E5EA'
          }}
          disabled={userRole === 'LEARNER'}
        >
          <Plus size={20} />
          {t('profile.currentProjects.startNew')}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12" style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '16px',
          color: '#8E8E93'
        }}>
          <p className="mb-4">{t('profile.currentProjects.noProjects')}</p>
          <button
            onClick={handleStartNew}
            className="hover:underline"
            style={{ color: '#16A34A', fontWeight: 500 }}
          >
            {t('profile.currentProjects.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-[#E5E5EA] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/writer/story/${project.id}`)}
            >
              <div className="flex items-start gap-4">
                {(project.thumbnailUrl || project.coverImageUrl) && (
                  <div className="relative rounded overflow-hidden flex-shrink-0"
                    style={{ width: '100px', height: '60px' }}
                  >
                    <Image
                      src={project.thumbnailUrl || project.coverImageUrl || ''}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: '#141414'
                    }}>
                      {project.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreHorizontal size={24} color="#8E8E93" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded"
                      style={{
                        ...getStatusStyle(project.status),
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                    <span style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '14px',
                      color: '#8E8E93'
                    }}>
                      {t('profile.currentProjects.lastEdited').replace('{date}', formatDate(project.lastEditedAt))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
