/**
 * Alle instellingen komen uit environment variables (.env lokaal, Environment op Render).
 * Zet hier niets gevoeligs hard in de code — dit bestand gaat mee naar GitHub.
 */

function parseStaffRoles(raw) {
  // Formaat:  roleId:Label:kleur , roleId:Label:kleur
  // De volgorde bepaalt de rangorde op de site (bovenste = hoogste rang).
  //
  // Let op: schrijf de kleur zonder hekje (7fb6e8, niet #7fb6e8). In een .env-bestand
  // begint een # namelijk een opmerking en wordt de rest van de regel weggegooid.
  // Staat er toch een # voor, dan halen we hem er hieronder gewoon af.
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [id, label, rawColor] = entry.split(':').map((p) => (p || '').trim());
      const hex = (rawColor || '').replace(/^#/, '');
      return {
        id,
        label: label || 'Staff',
        color: /^[0-9a-f]{6}$|^[0-9a-f]{3}$/i.test(hex) ? `#${hex}` : '#3f8ed6',
        order: index,
      };
    })
    .filter((role) => /^\d{5,}$/.test(role.id));
}

export const config = {
  port: process.env.PORT || 3000,
  siteUrl: (process.env.SITE_URL || '').replace(/\/$/, ''),

  tebex: {
    // Gebruik alleen de Public Token van de Tebex Headless API. Nooit een private API-key in de frontend zetten.
    publicToken: (process.env.TEBEX_PUBLIC_TOKEN || '').trim(),
    packageIdent: (process.env.TEBEX_PACKAGE_IDENT || 'pkg_3482158_7761862').trim(),
    // Tebex's basket endpoint expects the numeric package ID.
    packageId: Number.parseInt(process.env.TEBEX_PACKAGE_ID || '7761862', 10),
  },

  discord: {
    token: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    staffRoles: parseStaffRoles(process.env.DISCORD_STAFF_ROLES),
    // Uitnodigingen van de vier community-servers (code achter discord.gg/)
    invites: [
      { key: 'roleplay', code: 'ms6ESz9K4D' },
      { key: 'overheid', code: '4zsn53BpUE' },
      { key: 'support', code: 'KG6KcAR7Ym' },
      { key: 'onderwereld', code: 'nDGrpubhFB' },
    ],
  },

  fivem: {
    // De code achter cfx.re/join/
    joinCode: process.env.FIVEM_JOIN_CODE || 'r7yby7',
    // Optioneel: het directe adres van je server, bijvoorbeeld 51.83.12.4:30120.
    // Is dit ingevuld, dan wordt de status daar opgehaald (sneller en betrouwbaarder).
    host: (process.env.FIVEM_SERVER_HOST || '').trim(),
  },
};

export const hasDiscord = Boolean(config.discord.token && config.discord.guildId);
export const hasTebex = Boolean(
  config.tebex.publicToken &&
  config.tebex.packageIdent &&
  Number.isInteger(config.tebex.packageId) &&
  config.tebex.packageId > 0
);
