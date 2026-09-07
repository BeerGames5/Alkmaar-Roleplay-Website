import { config, hasDiscord } from './config.js';
import { cached } from './cache.js';

const API = 'https://discord.com/api/v10';
const UA = 'AlkmaarRoleplay-Website (https://github.com, 1.0)';

async function discordApi(path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bot ${config.discord.token}`,
      'User-Agent': UA,
    },
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`rate limited, wacht ${body.retry_after ?? '?'}s`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord ${res.status} op ${path} — ${text.slice(0, 180)}`);
  }
  return res.json();
}

/** Bouwt de avatar-URL: eerst de server-specifieke avatar, dan de account-avatar, dan de standaard. */
function avatarUrl(member) {
  const user = member.user;
  if (member.avatar) {
    const ext = member.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/guilds/${config.discord.guildId}/users/${user.id}/avatars/${member.avatar}.${ext}?size=256`;
  }
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function displayName(member) {
  return member.nick || member.user.global_name || member.user.username;
}

async function fetchAllMembers() {
  const members = [];
  let after = '0';

  // Max 10 pagina's = 10.000 leden. Genoeg voor vrijwel elke community.
  for (let page = 0; page < 10; page++) {
    const batch = await discordApi(
      `/guilds/${config.discord.guildId}/members?limit=1000&after=${after}`
    );
    members.push(...batch);
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }

  return members;
}

/** Staffleden gegroepeerd per rol, in de volgorde van DISCORD_STAFF_ROLES. */
export async function getStaff() {
  if (!hasDiscord) return { configured: false, groups: [] };
  if (config.discord.staffRoles.length === 0) {
    return { configured: false, groups: [], reason: 'geen rollen ingesteld' };
  }

  return cached('staff', 5 * 60 * 1000, async () => {
    const members = await fetchAllMembers();
    const roleIds = new Set(config.discord.staffRoles.map((r) => r.id));

    const buckets = new Map(
      config.discord.staffRoles.map((role) => [role.id, { ...role, members: [] }])
    );

    for (const member of members) {
      if (member.user?.bot) continue;
      const memberRoles = member.roles || [];
      // Hoogste geconfigureerde rol wint (die staat het hoogst in de env-variabele).
      const match = config.discord.staffRoles.find(
        (role) => roleIds.has(role.id) && memberRoles.includes(role.id)
      );
      if (!match) continue;

      buckets.get(match.id).members.push({
        id: member.user.id,
        name: displayName(member),
        username: member.user.username,
        avatar: avatarUrl(member),
        joinedAt: member.joined_at,
      });
    }

    const groups = [...buckets.values()]
      .filter((group) => group.members.length > 0)
      .map((group) => ({
        ...group,
        members: group.members.sort((a, b) =>
          (a.joinedAt || '').localeCompare(b.joinedAt || '')
        ),
      }));

    return { configured: true, groups, total: groups.reduce((n, g) => n + g.members.length, 0) };
  });
}

/** Leden- en online-aantallen van de vier community-servers. */
export async function getCommunities() {
  const fallback = config.discord.invites.map((i) => ({ ...i, members: null, online: null }));
  if (!hasDiscord) return fallback;

  return cached('communities', 10 * 60 * 1000, async () => {
    const results = await Promise.all(
      config.discord.invites.map(async (invite) => {
        try {
          const data = await discordApi(`/invites/${invite.code}?with_counts=true`);
          return {
            ...invite,
            name: data.guild?.name || null,
            members: data.approximate_member_count ?? null,
            online: data.approximate_presence_count ?? null,
          };
        } catch (err) {
          console.error(`[discord] invite ${invite.code}: ${err.message}`);
          return { ...invite, members: null, online: null };
        }
      })
    );
    return results;
  });
}

/** Leden/online van de hoofdserver, voor de statusbalk. */
export async function getGuildCounts() {
  if (!hasDiscord) return null;

  return cached('guild-counts', 5 * 60 * 1000, async () => {
    const guild = await discordApi(`/guilds/${config.discord.guildId}?with_counts=true`);
    return {
      name: guild.name,
      members: guild.approximate_member_count ?? null,
      online: guild.approximate_presence_count ?? null,
    };
  });
}

/** Stuurt een bestelling naar een Discord-kanaal via webhook. */
export async function sendOrderWebhook(embed) {
  if (!config.discord.orderWebhook) return;
  try {
    await fetch(config.discord.orderWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alkmaar Webshop', embeds: [embed] }),
    });
  } catch (err) {
    console.error('[discord] webhook mislukt:', err.message);
  }
}

/**
 * Diagnose: wie is deze bot, en in welke servers zit hij?
 * Handig als je een "Unknown Guild" ziet — dan klopt het server-ID niet
 * of hoort het token bij een andere applicatie dan je hebt uitgenodigd.
 */
export async function getBotInfo() {
  const [bot, guilds] = await Promise.all([
    discordApi('/users/@me'),
    discordApi('/users/@me/guilds'),
  ]);

  return {
    bot: `${bot.username} (ID ${bot.id})`,
    guilds: guilds.map((g) => ({ id: g.id, naam: g.name })),
  };
}
