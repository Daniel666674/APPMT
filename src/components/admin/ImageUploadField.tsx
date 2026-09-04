"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Uploads a logo, favicon or hero photo straight from disk and hands back its
 * URL — no more asking a client for a link to their own image, or hosting it
 * somewhere and pasting that in. Drop or click, see the thumbnail, done.
 *
 * `businessId` scopes the upload to one agenda; omit it only from the creator
 * wizard, where the agenda doesn't exist yet — the API route treats that as a
 * draft upload and only a platform admin is allowed to make one.
 */
export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  businessId,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon",
  aspect = "square",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  businessId?: string;
  accept?: string;
  aspect?: "square" | "wide";
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      if (businessId) body.set("businessId", businessId);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No pudimos subir la imagen");

      onChange(data.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-background px-3 py-2.5 transition-colors hover:border-brand",
          dragOver && "border-brand bg-brand-soft",
          aspect === "wide" && "min-h-[88px]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <span
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-secondary/40",
            aspect === "wide" ? "h-16 w-24" : "h-10 w-10"
          )}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </span>

        <span className="min-w-0 flex-1 text-xs text-muted-foreground">
          {uploading ? (
            "Subiendo…"
          ) : value ? (
            <>
              <span className="block truncate font-medium text-foreground">Imagen cargada</span>
              <span className="block">Haz clic para cambiarla, o arrastra otra aquí.</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Upload className="h-3.5 w-3.5" /> Subir imagen
              </span>
              <span className="block">Haz clic o arrastra un archivo — PNG, JPG, WEBP o SVG.</span>
            </>
          )}
        </span>

        {value && !uploading ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Quitar imagen"
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
