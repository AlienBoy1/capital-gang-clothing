"use client";

import Image from "next/image";
import Link from "next/link";
import { FolderKanban, Images, Megaphone } from "lucide-react";
import { AI_PROJECT_STATUS_LABELS } from "../../domain/entities";
import type { AIProjectListItem } from "../types";
import { ProcessingStatus } from "./ProcessingStatus";

export function AIProjectCard({ project }: { project: AIProjectListItem }) {
  const previews = (project.assets ?? [])
    .map((asset) => asset.currentVersion?.storagePath)
    .filter(Boolean)
    .slice(0, 4) as string[];

  return (
    <Link
      href={`/dashboard/ai-studio/${project.id}`}
      className="panel group flex flex-col overflow-hidden transition hover:border-brand/40 hover:ring-1 hover:ring-brand/20"
    >
      <div className="relative grid h-36 grid-cols-2 gap-0.5 bg-elevated sm:h-40">
        {previews.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center text-subtle">
            <FolderKanban size={28} strokeWidth={1.5} />
          </div>
        ) : (
          previews.map((src, i) => (
            <div key={`${src}-${i}`} className="relative overflow-hidden bg-canvas">
              <Image
                src={src}
                alt=""
                fill
                sizes="200px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ))
        )}
        {previews.length === 1 && <div className="bg-brand-soft/40" />}
        {previews.length === 3 && <div className="bg-elevated" />}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-fg">{project.name}</h3>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{project.description}</p>
            )}
          </div>
          <ProcessingStatus status={project.status === "PROCESSING" ? "PROCESSING" : project.status === "PUBLISHED" ? "PUBLISHED" : project.status === "ARCHIVED" ? "ARCHIVED" : project.status === "READY" ? "READY" : "DRAFT"} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-subtle">
          <span className="inline-flex items-center gap-1">
            <Images size={13} />
            {project._count?.assets ?? 0} assets
          </span>
          <span className="inline-flex items-center gap-1">
            <Megaphone size={13} />
            {project._count?.publications ?? 0} pubs
          </span>
          <span className="ml-auto">
            {new Date(project.createdAt).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
        <p className="sr-only">{AI_PROJECT_STATUS_LABELS[project.status]}</p>
      </div>
    </Link>
  );
}
