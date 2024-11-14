export function steamId64FromSteamId32(steamId: string) {
  const parts = steamId.split(':');
  const y = parseInt(parts[1]);
  const z = parseInt(parts[2]);

  const steamId64 = BigInt(76561197960265728) + BigInt(y) + (BigInt(z) * 2n);
  return steamId64.toString();
}
