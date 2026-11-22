const DEFAULT_PUBLIC_APP_URL = "https://interglott-zeta.vercel.app";

export function getPublicAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_APP_URL?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_PUBLIC_APP_URL;
  return base.replace(/\/+$/, "");
}

export function getPublicDashboardUrl(): string {
  return `${getPublicAppUrl()}/dashboard`;
}
