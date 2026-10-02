import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveImage } from "@/lib/images";
import { uploadMedia } from "@/lib/storage";

/** Upload a file (to Storage) or paste a URL. `accept` lets the same control handle video. */
export function ImageUpload({
  value,
  onChange,
  folder,
  accept = "image/*",
  placeholder = "https://… or upload",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isVideo = accept.startsWith("video");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadMedia(file, folder));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          aria-label="Upload file"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          <span className="sr-only sm:not-sr-only">Upload</span>
        </Button>
      </div>
      {value && (
        <div className="relative h-20 w-28 overflow-hidden rounded-lg border border-border bg-secondary">
          {isVideo ? (
            <video src={value} className="h-full w-full object-cover" muted />
          ) : (
            <img src={resolveImage(value)} alt="Preview" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            aria-label="Remove"
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-foreground"
            onClick={() => onChange("")}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
