'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  status: string;
  lastEditedAt: Date;
  thumbnailUrl?: string;
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

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-purple-100 text-purple-800',
    STORY_REVIEW: 'bg-yellow-100 text-yellow-800',
    NEEDS_REVISION: 'bg-red-100 text-red-800',
  };

  const handleStartNew = () => {
    if (userRole === 'LEARNER') {
      alert(t('Students cannot create stories'));
      return;
    }
    router.push('/submit/text');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('profile.currentProjects.title')}</h2>
        <button
          onClick={handleStartNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={userRole === 'LEARNER'}
        >
          + {t('profile.currentProjects.startNew')}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{t('profile.currentProjects.noProjects')}</p>
          <button
            onClick={handleStartNew}
            className="text-blue-600 hover:underline"
          >
            {t('profile.currentProjects.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/submit/text/${project.id}`)}
            >
              <div className="flex items-start gap-4">
                {project.thumbnailUrl && (
                  <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                      {t(`profile.stats.${project.status.toLowerCase()}`)}
                    </span>
                  </div>
                  {project.summary && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.summary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{t('profile.currentProjects.lastEdited').replace('{date}', new Date(project.lastEditedAt).toLocaleDateString())}</span>
                    {project.wordCount && <span>{project.wordCount} words</span>}
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
