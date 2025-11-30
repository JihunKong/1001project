export type TeacherResourceType = 'TEXTBOOK' | 'WORKSHEET' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface TeacherResource {
  id: string;
  title: string;
  description: string | null;
  type: TeacherResourceType;
  subject: string;
  grade: string;
  fileUrl: string;
  fileSize: number | null;
  duration: number | null;
  thumbnailUrl: string | null;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  rating: number | null;
  ratingCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isFavorited?: boolean;
}

export interface ResourceCollection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  itemCount: number;
  previewResources: TeacherResource[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type TabType = 'resources' | 'collections' | 'favorites';
export type ViewType = 'grid' | 'list';
export type SortType = 'createdAt' | 'popular' | 'rating' | 'title';

export interface FilterState {
  type: string;
  subject: string;
  grade: string;
  search: string;
}
