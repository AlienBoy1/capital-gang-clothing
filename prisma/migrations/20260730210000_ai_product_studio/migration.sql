-- CreateEnum
CREATE TYPE "AIProjectStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AIAssetStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'ARCHIVED', 'ERROR');

-- CreateEnum
CREATE TYPE "AIAssetType" AS ENUM ('ORIGINAL', 'BACKGROUND_REMOVED', 'WHITE_BACKGROUND', 'BLACK_BACKGROUND', 'PNG', 'WEBP', 'JPG', 'MOCKUP', 'STREET', 'FLATLAY', 'TRYON_MAN', 'TRYON_WOMAN', 'DETAIL', 'THUMBNAIL', 'PREVIEW_3D', 'GLB');

-- CreateEnum
CREATE TYPE "AIVersionJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "CatalogPublicationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CatalogPublishSessionStatus" AS ENUM ('PENDING', 'CONSUMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ai_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AIProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_assets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetType" "AIAssetType" NOT NULL DEFAULT 'ORIGINAL',
    "status" "AIAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_asset_versions" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "parentVersionId" TEXT,
    "processingType" "AIAssetType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "checksum" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "jobStatus" "AIVersionJobStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,

    CONSTRAINT "ai_asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_processing_jobs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "targetTypes" "AIAssetType"[],
    "status" "AIVersionJobStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ai_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_publications" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT NOT NULL,
    "status" "CatalogPublicationStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "catalog_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_publication_assets" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "assetVersionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalog_publication_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_publish_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "CatalogPublishSessionStatus" NOT NULL DEFAULT 'PENDING',
    "storeType" "StoreType" NOT NULL DEFAULT 'CLOTHING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_publish_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_publish_session_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assetVersionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalog_publish_session_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN "assetVersionId" TEXT;

-- CreateIndex
CREATE INDEX "ai_projects_status_createdAt_idx" ON "ai_projects"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_assets_currentVersionId_key" ON "ai_assets"("currentVersionId");

-- CreateIndex
CREATE INDEX "ai_assets_projectId_status_idx" ON "ai_assets"("projectId", "status");

-- CreateIndex
CREATE INDEX "ai_assets_projectId_favorite_idx" ON "ai_assets"("projectId", "favorite");

-- CreateIndex
CREATE INDEX "ai_asset_versions_assetId_createdAt_idx" ON "ai_asset_versions"("assetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_asset_versions_assetId_versionNumber_key" ON "ai_asset_versions"("assetId", "versionNumber");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_assetId_status_idx" ON "ai_processing_jobs"("assetId", "status");

-- CreateIndex
CREATE INDEX "catalog_publications_projectId_publishedAt_idx" ON "catalog_publications"("projectId", "publishedAt");

-- CreateIndex
CREATE INDEX "catalog_publications_productId_idx" ON "catalog_publications"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_publication_assets_publicationId_assetVersionId_key" ON "catalog_publication_assets"("publicationId", "assetVersionId");

-- CreateIndex
CREATE INDEX "catalog_publish_sessions_createdById_status_idx" ON "catalog_publish_sessions"("createdById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_publish_session_items_sessionId_assetVersionId_key" ON "catalog_publish_session_items"("sessionId", "assetVersionId");

-- CreateIndex
CREATE INDEX "product_images_assetVersionId_idx" ON "product_images"("assetVersionId");

-- AddForeignKey
ALTER TABLE "ai_projects" ADD CONSTRAINT "ai_projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_assets" ADD CONSTRAINT "ai_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ai_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_asset_versions" ADD CONSTRAINT "ai_asset_versions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ai_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_asset_versions" ADD CONSTRAINT "ai_asset_versions_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ai_asset_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_asset_versions" ADD CONSTRAINT "ai_asset_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_assets" ADD CONSTRAINT "ai_assets_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ai_asset_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_processing_jobs" ADD CONSTRAINT "ai_processing_jobs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ai_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publications" ADD CONSTRAINT "catalog_publications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ai_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publications" ADD CONSTRAINT "catalog_publications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publications" ADD CONSTRAINT "catalog_publications_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publication_assets" ADD CONSTRAINT "catalog_publication_assets_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "catalog_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publication_assets" ADD CONSTRAINT "catalog_publication_assets_assetVersionId_fkey" FOREIGN KEY ("assetVersionId") REFERENCES "ai_asset_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publish_sessions" ADD CONSTRAINT "catalog_publish_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ai_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publish_sessions" ADD CONSTRAINT "catalog_publish_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publish_session_items" ADD CONSTRAINT "catalog_publish_session_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "catalog_publish_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_publish_session_items" ADD CONSTRAINT "catalog_publish_session_items_assetVersionId_fkey" FOREIGN KEY ("assetVersionId") REFERENCES "ai_asset_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_assetVersionId_fkey" FOREIGN KEY ("assetVersionId") REFERENCES "ai_asset_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
