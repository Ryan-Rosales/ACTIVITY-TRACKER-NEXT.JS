import { createClient } from "@supabase/supabase-js";
import type { TaskNoteAttachment } from "@/lib/types/taskNotes";

export const TASK_NOTES_BUCKET = "task-note-attachments";

const getStorageConfig = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
};

const globalForStorage = globalThis as unknown as {
  supabaseStorageClient?: ReturnType<typeof createClient<any>>;
  taskNotesBucketChecked?: boolean;
};

export const getSupabaseStorageClient = () => {
  if (globalForStorage.supabaseStorageClient) {
    return globalForStorage.supabaseStorageClient;
  }

  const { url, serviceRoleKey } = getStorageConfig();
  const client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  globalForStorage.supabaseStorageClient = client;
  return client;
};

export const ensureTaskNotesBucket = async () => {
  if (globalForStorage.taskNotesBucketChecked) return;

  const client = getSupabaseStorageClient();
  const { data: buckets, error } = await client.storage.listBuckets();

  if (error) {
    throw new Error(error.message || "Unable to list Supabase buckets.");
  }

  const bucketExists = buckets.some((bucket) => bucket.id === TASK_NOTES_BUCKET);
  if (!bucketExists) {
    const { error: createError } = await client.storage.createBucket(TASK_NOTES_BUCKET, {
      public: false,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: [
        "application/octet-stream",
        "application/pdf",
        "application/msword",
        "application/vnd.ms-word",
        "application/vnd.msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
        "text/csv",
        "text/html",
        "application/json",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
      ],
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(createError.message || "Unable to create Supabase bucket.");
    }
  }

  globalForStorage.taskNotesBucketChecked = true;
};

export const sanitizeFilename = (filename: string) =>
  filename
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120) || "file";

export const buildAttachmentStoragePath = (email: string, taskId: string, attachmentId: string, filename: string) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, "_");
  const safeTaskId = taskId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = sanitizeFilename(filename);
  return `${safeEmail}/${safeTaskId}/${attachmentId}-${safeName}`;
};

export const createSignedPreviewUrl = async (storagePath: string) => {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.storage
    .from(TASK_NOTES_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    return "";
  }

  return data.signedUrl;
};

export const hydrateAttachmentsWithPreviewUrls = async (attachments: TaskNoteAttachment[]) => {
  const hydrated = await Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      previewUrl: attachment.storagePath ? await createSignedPreviewUrl(attachment.storagePath) : "",
    })),
  );

  return hydrated;
};
