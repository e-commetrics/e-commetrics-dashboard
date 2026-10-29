import type { MessageChannel } from "./types";

// Canales apagados a proposito mientras no se validen en produccion. Para
// reactivar uno, quitarlo de esta lista. El backend sigue aceptando el envio:
// esto solo bloquea la interfaz.
export const DISABLED_CHANNELS: readonly MessageChannel[] = ["sms", "whatsapp"];

export function isChannelDisabled(channel: MessageChannel): boolean {
  return DISABLED_CHANNELS.includes(channel);
}
