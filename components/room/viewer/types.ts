export interface ActiveMeetingDoc {
  type: "doc" | "note" | "citation";
  id?: string;
  assetId?: string;
  title: string;
  fileType?: string;
  downloadUrl?: string;
  rawUrl?: string;
  content?: string;
  citationText?: string;
}

export type ZoomMode = "fit-width" | "actual" | number;

export interface ViewerPageInfo {
  currentPage: number;
  totalPages: number;
}
