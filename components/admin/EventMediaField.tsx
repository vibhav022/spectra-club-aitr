 
"use client";

/* eslint-disable @next/next/no-img-element -- admin previews load ImageKit URLs */
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Video, Film } from "lucide-react";
import {
  ApiError,
  mediaUrl,
  uploadFile,
} from "@/lib/admin/api";
import { btnSmall, Spinner } from "./ui";

type MediaKind = "image" | "video";

interface EventMediaFieldProps {
  kind: MediaKind;
  url: string | null;
  onChange: (media: { id: string | null; url: string | null }) => void;
  label?: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

export function EventMediaField({
  kind,
  url,
  onChange,
  label,
}: EventMediaFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isImage = kind === "image";
  const acceptedTypes = isImage ? IMAGE_TYPES : VIDEO_TYPES;

  const pick = async (file?: File) => {
    if (!file) return;

    setError("");

    if (!acceptedTypes.includes(file.type)) {
      setError(
        isImage
          ? "Use a JPEG, PNG or WebP image."
          : "Use an MP4 or WebM video."
      );
      return;
    }

    const maxSize = isImage
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        isImage
          ? "Image is larger than 10 MB."
          : "Video is larger than 100 MB."
      );
      return;
    }

    setProgress(0);

    try {
      const uploaded = await uploadFile(
        file,
        isImage ? "photo" : "gallery",
        {},
        setProgress
      );

      onChange({
        id: uploaded.id,
        url: mediaUrl(uploaded.url) ?? null,
      });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Upload failed."
      );
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  const remove = () => {
    onChange({ id: null, url: null });
    setError("");
  };

  return (
    <div className="min-w-0 w-full">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label ?? (isImage ? "Event poster" : "Event video")}
      </span>

      <div
        className={
          isImage
            ? "flex flex-wrap items-start gap-4"
            : "flex min-w-0 w-full flex-col items-start gap-3"
        }
      >
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-surface ${
            isImage
              ? "h-36 w-28"
              : "aspect-video w-full max-w-full"
          }`}
        >
          {url ? (
            isImage ? (
              <img
                src={url}
                alt="Event poster preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={url}
                controls
                preload="metadata"
                playsInline
                className="h-full w-full object-contain"
              />
            )
          ) : isImage ? (
            <ImagePlus
              className="h-8 w-8 text-white/25"
              aria-hidden="true"
            />
          ) : (
            <Film
              className="h-8 w-8 text-white/25"
              aria-hidden="true"
            />
          )}

          {progress !== null && (
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-deep/80 text-xs text-ink"
            >
              <Spinner className="h-4 w-4" />
              {Math.round(progress * 100)}%
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={acceptedTypes.join(",")}
            className="sr-only"
            id={`event-media-${kind}`}
            onChange={(e) => pick(e.target.files?.[0])}
            disabled={progress !== null}
          />

          <label
            htmlFor={`event-media-${kind}`}
            className={`${btnSmall} cursor-pointer ${
              progress !== null
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            {isImage ? (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Video className="h-4 w-4" aria-hidden="true" />
            )}
            {url ? "Replace" : "Upload"}
          </label>

          {url && (
            <button
              type="button"
              className={btnSmall}
              onClick={remove}
              disabled={progress !== null}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        {isImage
          ? "JPEG, PNG or WebP · Maximum 10 MB"
          : "MP4 or WebM · Maximum 100 MB"}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
