/**
 * Cloudflare R2 Storage Utility (Titrra)
 *
 * S3-compatible client over Cloudflare R2. Buckets:
 * - titrra-dev  → served via the managed pub-*.r2.dev URL
 * - titrra-prod → served ONLY via the custom domain https://assets.titrra.com
 *
 * `put()` returns a public URL (`${R2_PUBLIC_URL}/${pathname}`). The bucket must
 * be public (dev) or fronted by a custom domain (prod) because downstream
 * consumers — notably Facebook's Graph `/photos` endpoint — fetch the image
 * directly from that URL. Lifted from @one-colored-pixel/storage (Chunky Crayon),
 * kept API-identical so it's a proven drop-in.
 */

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Lazy singleton so importing this module never throws when R2 env is unset
// (e.g. a worker route that doesn't touch storage still boots).
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'R2 configuration missing. Required env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL',
      );
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return r2Client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error('R2_BUCKET environment variable is required');
  }
  return bucket;
}

function getPublicUrl(): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error(
      'R2_PUBLIC_URL environment variable is required (your R2 public bucket URL or custom domain)',
    );
  }
  return publicUrl.replace(/\/$/, '');
}

export type PutOptions = {
  access?: 'public' | 'private';
  contentType?: string;
  allowOverwrite?: boolean;
};

export type PutResult = {
  url: string;
  pathname: string;
};

export type ListResult = {
  blobs: Array<{
    pathname: string;
    url: string;
    size: number;
    uploadedAt: Date;
  }>;
  cursor?: string;
  hasMore: boolean;
};

export type ListOptions = {
  prefix?: string;
  limit?: number;
  cursor?: string;
};

/**
 * Upload a file to R2 storage.
 *
 * @param pathname - The key for the file (e.g. 'social/facebook/2026-07-12.png')
 * @param body - The file content as Buffer, Uint8Array, or string
 * @param options - Upload options (contentType, access, allowOverwrite)
 * @returns The public URL and pathname
 */
export async function put(
  pathname: string,
  body: Buffer | Uint8Array | string,
  options: PutOptions = {},
): Promise<PutResult> {
  const client = getR2Client();
  const bucket = getBucket();
  const publicUrl = getPublicUrl();

  const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : body;
  const contentType = options.contentType || inferContentType(pathname);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: pathname,
      Body: bodyBuffer,
      ContentType: contentType,
    }),
  );

  return { url: `${publicUrl}/${pathname}`, pathname };
}

/**
 * Delete a file from R2 storage. Accepts a full public URL or a bare pathname.
 */
export async function del(urlOrPathname: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucket();
  const publicUrl = getPublicUrl();

  let pathname = urlOrPathname;
  if (urlOrPathname.startsWith('http')) {
    if (urlOrPathname.includes(publicUrl)) {
      pathname = urlOrPathname.replace(`${publicUrl}/`, '');
    } else {
      const url = new URL(urlOrPathname);
      pathname = url.pathname.slice(1);
    }
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: pathname }));
}

/**
 * List files in R2 storage (paginated).
 */
export async function list(options: ListOptions = {}): Promise<ListResult> {
  const client = getR2Client();
  const bucket = getBucket();
  const publicUrl = getPublicUrl();

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: options.prefix,
      MaxKeys: options.limit || 1000,
      ContinuationToken: options.cursor,
    }),
  );

  const blobs = (response.Contents || []).map((item) => ({
    pathname: item.Key || '',
    url: `${publicUrl}/${item.Key}`,
    size: item.Size || 0,
    uploadedAt: item.LastModified || new Date(),
  }));

  return {
    blobs,
    cursor: response.NextContinuationToken,
    hasMore: response.IsTruncated || false,
  };
}

/**
 * Check whether a file exists in R2 storage.
 */
export async function exists(pathname: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getBucket();

  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: pathname }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Infer content type from a file extension.
 */
function inferContentType(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}
