import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const MAX_BYTES = 10 * 1024 * 1024;

/** Uploads a file to the public `media` bucket (admin-only via RLS) and returns its public URL. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("File is too large (max 10 MB).");
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
