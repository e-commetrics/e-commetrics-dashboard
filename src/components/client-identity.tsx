"use client";

import { clientIdentity, identityVars, type ClientIdentity } from "@/lib/client-identity";

/** Logo tile, or a monogram in the client colour when there is no logo yet. */
export function ClientTile({ identity, size = 40, radius }: { identity: ClientIdentity; size?: number; radius?: number }) {
  const r = radius ?? Math.round(size * 0.26);
  if (identity.logo) {
    return (
      <span className="ec-client-tile" style={{ width: size, height: size, borderRadius: r }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={identity.logo} alt="" />
      </span>
    );
  }
  return (
    <span
      className="ec-client ec-client-mono"
      style={{ ...identityVars(identity), width: size, height: size, borderRadius: r, fontSize: Math.round(size * 0.34) }}
      aria-hidden
    >
      {identity.initials}
    </span>
  );
}

/** Small mark in the client colour. Always sits next to the name, never replaces it. */
export function ClientDot({ name, color, size = 8, square }: { name: string; color?: string | null; size?: number; square?: boolean }) {
  const identity = clientIdentity(name, { color });
  return (
    <span
      className="ec-client ec-client-dot"
      style={{ ...identityVars(identity), width: size, height: size, borderRadius: square ? Math.max(2, Math.round(size / 3)) : "50%" }}
      aria-hidden
    />
  );
}
