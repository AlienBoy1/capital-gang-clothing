import type { AIAssetStatus, AIAssetType, AIProjectStatus, AIVersionJobStatus } from "../domain/entities";

export interface AIVersionDTO {
  id: string;
  assetId: string;
  versionNumber: number;
  parentVersionId: string | null;
  processingType: AIAssetType;
  storagePath: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number | null;
  checksum: string | null;
  createdById: string | null;
  createdAt: string;
  isCurrent: boolean;
  isOriginal: boolean;
  jobStatus: AIVersionJobStatus;
  notes: string | null;
}

export interface AIAssetDTO {
  id: string;
  projectId: string;
  assetType: AIAssetType;
  status: AIAssetStatus;
  favorite: boolean;
  currentVersionId: string | null;
  currentVersion: AIVersionDTO | null;
  versions: AIVersionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AIProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: AIProjectStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  _count?: { assets: number; publications: number };
  assets?: Array<{
    id: string;
    currentVersion: { storagePath: string; processingType: AIAssetType } | null;
  }>;
}

export interface CatalogPublicationDTO {
  id: string;
  projectId: string;
  productId: string | null;
  publishedAt: string;
  status: string;
  product?: { id: string; name: string; slug: string } | null;
  publishedBy?: { firstName: string; lastName: string };
  assets: Array<{
    id: string;
    order: number;
    assetVersion: AIVersionDTO;
  }>;
}

export interface AIProjectDetail extends AIProjectListItem {
  assets: AIAssetDTO[];
  publications: CatalogPublicationDTO[];
}
