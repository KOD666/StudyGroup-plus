export interface LoungeFileItem {
  id: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  mimeType: string | null;
  createdAt: string;
  uploaderId: string;
  uploaderName: string | null;
  uploaderAvatar: string | null;
}

export interface FilesPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type FileTypeFilter =
  | "all"
  | "pdf"
  | "md"
  | "pptx"
  | "transcript"
  | "other";

export type FileSortOption = "newest" | "oldest" | "name_asc" | "name_desc";
