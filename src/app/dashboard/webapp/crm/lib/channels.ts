import type { MessageChannel } from "./types";

// SMS sigue apagado hasta validarlo en produccion. El backend acepta el envio;
// esta lista solo bloquea la interfaz.
export const DISABLED_CHANNELS: readonly MessageChannel[] = ["sms"];

export function isChannelDisabled(channel: MessageChannel): boolean {
  return DISABLED_CHANNELS.includes(channel);
}
