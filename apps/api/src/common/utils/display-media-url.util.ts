const UPLOAD_FOLDER_PREFIX = /^(customer-photos|child-savings|collateral)\//;

function parseSupabaseObjectPath(stored: string, bucket: string): string | null {
  const trimmed = stored.trim();
  const publicMatch = trimmed.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/i);
  if (publicMatch?.[1]) {
    return decodeURIComponent(publicMatch[1]);
  }
  const authMatch = trimmed.match(/\/storage\/v1\/object\/authenticated\/[^/]+\/(.+)$/i);
  if (authMatch?.[1]) {
    return decodeURIComponent(authMatch[1]);
  }
  const bucketMatch = trimmed.match(new RegExp(`/${bucket}/(.+)$`, 'i'));
  if (bucketMatch?.[1] && !bucketMatch[1].includes('?')) {
    return decodeURIComponent(bucketMatch[1]);
  }
  if (UPLOAD_FOLDER_PREFIX.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media';
  if (!url || !key) return null;
  return { url, key, bucket };
}

function absoluteStorageUrl(projectUrl: string, signedOrPath: string): string {
  if (signedOrPath.startsWith('http://') || signedOrPath.startsWith('https://')) {
    return signedOrPath;
  }
  const base = projectUrl.replace(/\/$/, '');
  if (signedOrPath.startsWith('/storage/v1/')) {
    return `${base}${signedOrPath}`;
  }
  if (signedOrPath.startsWith('/object/')) {
    return `${base}/storage/v1${signedOrPath}`;
  }
  return `${base}${signedOrPath.startsWith('/') ? signedOrPath : `/${signedOrPath}`}`;
}

function encodeObjectPathForUrl(objectPath: string): string {
  return objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/** URLs safe for `<img src>` (signed Supabase link or local /uploads path). */
export async function resolveDisplayMediaUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored?.trim()) return null;

  const value = stored.trim();
  if (value.startsWith('/uploads/')) {
    return value;
  }

  const cfg = supabaseConfig();
  const objectPath = cfg ? parseSupabaseObjectPath(value, cfg.bucket) : null;
  if (!cfg || !objectPath) {
    return value.startsWith('http') ? value : null;
  }

  const encodedPath = encodeObjectPathForUrl(objectPath);

  try {
    const signRes = await fetch(
      `${cfg.url}/storage/v1/object/sign/${cfg.bucket}/${encodedPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.key}`,
          apikey: cfg.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 60 * 60 * 24 }),
      },
    );

    if (signRes.ok) {
      const body = (await signRes.json()) as { signedURL?: string; signedUrl?: string };
      const signed = body.signedURL ?? body.signedUrl;
      if (signed) {
        return absoluteStorageUrl(cfg.url, signed);
      }
    }
  } catch {
    // fall through to public URL
  }

  return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${encodedPath}`;
}

type AccountWithOptionalPhoto = { childPhotoUrl?: string | null } & Record<string, unknown>;

export async function withDisplayMediaUrls<T extends Record<string, unknown>>(
  customer: T,
): Promise<T> {
  const photoUrl =
    'photoUrl' in customer
      ? await resolveDisplayMediaUrl(customer.photoUrl as string | null | undefined)
      : undefined;

  let accounts = customer.accounts as AccountWithOptionalPhoto[] | undefined;
  if (Array.isArray(accounts)) {
    accounts = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        childPhotoUrl:
          account.childPhotoUrl != null
            ? await resolveDisplayMediaUrl(account.childPhotoUrl)
            : account.childPhotoUrl,
      })),
    );
  }

  return {
    ...customer,
    ...(photoUrl !== undefined ? { photoUrl } : {}),
    ...(accounts !== undefined ? { accounts } : {}),
  };
}

export async function withLoanDisplayMediaUrls<T extends Record<string, unknown>>(
  loan: T,
): Promise<T> {
  if (!('collateralPhotoUrl' in loan)) {
    return loan;
  }
  return {
    ...loan,
    collateralPhotoUrl: await resolveDisplayMediaUrl(
      loan.collateralPhotoUrl as string | null | undefined,
    ),
  };
}
