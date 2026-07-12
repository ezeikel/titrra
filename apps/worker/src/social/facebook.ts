// Facebook Page publishing via the Graph API. Mirrors Chunky Crayon's proven
// call (graph.facebook.com/v22.0/{PAGE_ID}/photos, JSON body). FB fetches the
// image server-side from the hosted `url`, so the image MUST be publicly
// reachable first (we host it on R2 → assets.titrra.com).
//
// Env:
//   FACEBOOK_PAGE_ID            — the Titrra Facebook Page's numeric id
//   FACEBOOK_PAGE_ACCESS_TOKEN  — a long-lived Page access token
//
// (CC names its token FACEBOOK_ACCESS_TOKEN; Titrra uses the more explicit
// FACEBOOK_PAGE_ACCESS_TOKEN — same value semantics, a long-lived Page token.)

const GRAPH_VERSION = 'v22.0';

export type FacebookPhotoResult = { id: string; postId?: string };

// Publish a photo post to the Titrra Facebook Page. Returns the created photo id
// (and the associated post id when Graph provides it).
export async function postPhotoToFacebookPage(
  imageUrl: string,
  message: string,
): Promise<FacebookPhotoResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error(
      'Facebook not configured: FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are required',
    );
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        message,
        access_token: accessToken,
      }),
    },
  );

  const data = (await res.json()) as {
    id?: string;
    post_id?: string;
    error?: unknown;
  };

  if (!res.ok || !data.id) {
    throw new Error(
      `Facebook publish failed (${res.status}): ${JSON.stringify(data)}`,
    );
  }

  return { id: data.id, postId: data.post_id };
}
