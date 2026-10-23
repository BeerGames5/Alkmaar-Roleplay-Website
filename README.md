# Alkmaar Roleplay — website

Website voor de FiveM-server **Alkmaar Roleplay**, met:

- live serverstatus (spelers, wachtrij, online/offline) via de Cfx.re-API
- teampagina die automatisch uit Discord komt, met avatar en naam per staflid
- ledenaantallen van de vier Discord-servers
- eigen webshop met Tebex Headless API voor **Alkmaar Admin Panel V2**
- FiveM/Cfx.re-accountautorisatie vóór de Tebex-checkout en automatische assetlevering via de ingestelde Tebex-package

Draait als één Node.js-applicatie. Geen database nodig.

Alle bestanden staan in deze ene map. De server-bestanden (`server.js`, `config.js`, `discord.js`,
`fivem.js`, `routes.js`, `cache.js`) draaien op de server en zijn voor bezoekers niet opvraagbaar.
Wat de bezoeker wél krijgt, staat in de lijst `PUBLIEKE_BESTANDEN` onderaan `server.js`: de
html-pagina's, `style.css`, `app.js` en de afbeeldingen.

**Voeg je een afbeelding of pagina toe, zet de bestandsnaam dan in die lijst.** Doe je dat niet,
dan krijg je een 404 — dat is geen fout, dat is de beveiliging die zijn werk doet.

---

## 1. Snel starten op je eigen pc

Je hebt [Node.js 20 of hoger](https://nodejs.org) nodig.

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev
```

Open http://localhost:3000. De site werkt meteen; het team blijft leeg tot je de stappen hieronder
doorloopt.

---

## 2. Tebex-webshop koppelen

De sectie **Webshop** staat in `index.html`; de productgegevens en checkout-flow staan in `tebex.js`, `routes.js` en `app.js`.

1. Open de Tebex Creator/Control Panel en ga naar **API Keys**. Kopieer de **Public Token** voor de Headless API. Gebruik hier geen private checkout-API-key.
2. In het Render-dashboard open je de service → **Environment**. Voeg `TEBEX_PUBLIC_TOKEN` toe met die Public Token.
3. Stel beide packagegegevens in: `TEBEX_PACKAGE_IDENT=pkg_3482158_7761862` (ident om het product op te zoeken) en `TEBEX_PACKAGE_ID=7761862` (numerieke ID die Tebex vereist bij het toevoegen aan een basket).
4. Controleer in Tebex dat de package het juiste **FiveM Asset** als deliverable bevat en dat de Cfx.re-integratie/accountkoppeling werkt.
5. Deploy de wijziging. Open `https://jouw-domein/api/shop/product`: de JSON moet `checkoutEnabled: true` tonen en de packagegegevens bevatten. Ga daarna naar **Webshop** op de website en doe zelf een aankooptest voordat je het publiek aankondigt.

Bij een klik op **Kopen via Tebex** maakt de backend een basket, voegt package-ID `7761862` toe, vraagt de FiveM-accountautorisatie op en stuurt de bezoeker daarna door naar de checkout-link die Tebex terugstuurt. De browser kan de package-ID of prijs niet zelf kiezen. Geen database is nodig voor deze flow; basketgegevens worden door Tebex beheerd.

### Lokaal testen

Kopieer `.env.example` naar `.env` en vul lokaal `TEBEX_PUBLIC_TOKEN` in. Start daarna met `npm install` en `npm run dev`. Laat `.env` lokaal staan en commit dit bestand nooit naar GitHub.

## 3. Discord koppelen (team + ledenaantallen)

### 3.1 Maak een bot aan

1. Ga naar https://discord.com/developers/applications en klik **New Application**. Noem hem
   bijvoorbeeld *Alkmaar Website*.
2. Ga naar **Bot** in het linkermenu.
3. Klik **Reset Token** en kopieer het token. Dit is je `DISCORD_BOT_TOKEN`.
   Zie je het token maar één keer — bewaar het meteen goed en deel het met niemand.
4. Scroll op dezelfde pagina naar **Privileged Gateway Intents** en zet
   **SERVER MEMBERS INTENT** aan. Sla op.
   Zonder dit kan de bot je ledenlijst niet ophalen en blijft de teampagina leeg.

### 3.2 Nodig de bot uit in je server

1. Ga naar **OAuth2 → URL Generator**.
2. Vink bij *Scopes* aan: `bot`.
3. Bij *Bot Permissions* is **View Channels** genoeg. Meer heeft hij niet nodig.
4. Open de gegenereerde link en voeg de bot toe aan **Alkmaar Roleplay** (de hoofdserver).

### 3.3 Zoek de ID's op

Zet eerst de ontwikkelaarsmodus aan in Discord: **Instellingen → Geavanceerd → Ontwikkelaarsmodus**.

- **Server-ID**: rechtermuisknop op de servernaam → *Server-ID kopiëren*. Dit is `DISCORD_GUILD_ID`.
- **Rol-ID's**: **Serverinstellingen → Rollen**, rechtermuisknop op een rol → *Rol-ID kopiëren*.

### 3.4 Stel de staffrollen in

`DISCORD_STAFF_ROLES` bepaalt welke rollen op de site komen, in welke volgorde en met welke kleur:

```
DISCORD_STAFF_ROLES=1234:Eigenaar:cfc46a,5678:Hoofd Staff:3f8ed6,9012:Moderator:58bf4c
```

Per rol: `rolID:Weergavenaam:kleur`, rollen gescheiden door een komma.

> Schrijf de kleur **zonder hekje**. In een `.env`-bestand begint `#` een opmerking, waardoor
> alles erachter wegvalt. In het Render-dashboard mag het hekje wel, maar zonder werkt overal.

- De **volgorde** is de rangorde op de site: de eerste rol staat bovenaan.
- Heeft iemand meerdere staffrollen, dan wordt hij getoond bij de hoogste.
- Wil je maar één rol tonen? Zet er dan gewoon één in.
- De kleur wordt gebruikt voor de kopregel en de rand om de avatar.

Vanaf nu geldt: wie in Discord die rol krijgt, staat binnen vijf minuten op de site. Wie hem
kwijtraakt, verdwijnt automatisch. Je hoeft niets handmatig bij te houden.

> Ledenaantallen bij de vier divisies werken al zodra de bot een geldig token heeft — daarvoor hoeft
> de bot niet in alle vier de servers te zitten.

---

## 4. Serverstatus

`FIVEM_JOIN_CODE=r7yby7` — dat is het stuk achter `cfx.re/join/`.

De site haalt de status uit twee bronnen:

1. **Rechtstreeks bij je server** — vul `FIVEM_SERVER_HOST` in met `IP:poort`, bijvoorbeeld
   `51.83.12.4:30120`. Elke FiveM-server publiceert daar `/info.json` en `/players.json`. Dit is de
   snelste en betrouwbaarste manier. Nadeel: je IP-adres staat dan in je omgevingsvariabelen (niet
   op de site zelf, bezoekers zien het niet).
2. **De publieke Cfx.re-lijst** — gebeurt automatisch als bron 1 niet is ingevuld of niet reageert.

Over Cfx.re: de API Voorwaarde: je server staat in de serverlijst
(standaard staat `sv_master1 ""` aan in je `server.cfg`). Is de server offline of onvindbaar, dan
toont de site netjes "Offline" in plaats van een foutmelding.

Wil je de wachtrij zien in de statusbalk? Zorg dat je queue-script de waarde als servervariabele
publiceert (bijvoorbeeld `sets Queue Count "3"`). Doet hij dat niet, dan blijft er `0` staan.

---

## 5. Op GitHub zetten

```bash
git init
git add .
git commit -m "Alkmaar Roleplay website"
git branch -M main
git remote add origin https://github.com/JOUWNAAM/alkmaar-roleplay.git
git push -u origin main
```

`.env` staat in `.gitignore` en gaat dus **niet** mee. Dat hoort ook zo: een token in een publieke
repo is binnen enkele minuten misbruikt.

---

## 6. Op Render zetten

1. Zorg dat `package.json`, `server.js`, `render.yaml` en de overige projectbestanden op de GitHub-repository staan. Als de map `Alkmaar-Roleplay-Website-main` zelf binnen de repository staat, kies die map als **Root Directory** of verplaats de inhoud naar de repository-root.
2. Ga naar https://dashboard.render.com.
3. Je kunt **New → Blueprint** gebruiken om de instellingen uit `render.yaml` automatisch toe te passen. Verbind de repository, controleer dat de Blueprint Path `render.yaml` is en volg de prompts voor `TEBEX_PUBLIC_TOKEN`. Als je liever **New → Web Service** kiest, stel de waarden handmatig in zoals hieronder.
4. Gebruik bij handmatige setup:
   - **Runtime/Language**: Node
   - **Branch**: `main` (of de branch waarop je website staat)
   - **Root Directory**: leeg als `package.json` direct in de repository-root staat; anders de map die `package.json` bevat
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Region**: Frankfurt
   - **Plan**: Free of een betaald plan naar keuze
   - **Health Check Path** (onder Advanced): `/api/health`
5. Nadat de service is aangemaakt, open **Environment → Add from .env** en importeer het meegeleverde Render-env-bestand. Klik daarna op **Save, rebuild, and deploy**. Render biedt bulk-import van geldige `.env`-bestanden aan.
6. Discord-teamgegevens en een direct FiveM-serveradres zijn optioneel. Vul later bij **Environment** `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_STAFF_ROLES` en/of `FIVEM_SERVER_HOST` in als je die functies wilt activeren.
7. `SITE_URL` is niet vereist: de backend gebruikt de hostnaam waarmee de bezoeker de checkout start, dus ook je custom domein.

Controleer na de deploy `https://jouw-service.onrender.com/api/health`. De JSON moet `ok: true` en `tebex: true` tonen. Open daarna `https://jouw-service.onrender.com/api/shop/product`: daar moeten de gegevens van **Alkmaar Admin Panel V2** staan.

### Eigen domein

Onder **Settings → Custom Domains** voeg je bijvoorbeeld `alkmaarroleplay.nl` toe. Render laat zien
welke DNS-records je bij je domeinaanbieder moet zetten.

---

## 7. Onderhoud

| Wat | Waar |
|---|---|
| Teksten en secties | `index.html` |
| Kleuren, lettertypes, opmaak | `style.css` |
| Tebex package en checkout-flow | `tebex.js`, `routes.js`, `app.js` |
| Discord-uitnodigingen | `config.js` (`invites`) |
| Welke bestanden bezoekers mogen zien | `server.js` (`PUBLIEKE_BESTANDEN`) |
| Wat er in de browser gebeurt | `app.js` |

De site ververst de status elke 45 seconden. Het team wordt maximaal vijf minuten gecachet, de
ledenaantallen tien minuten — dat houdt je ruim binnen de limieten van Discord.

## Problemen oplossen

**Het team blijft leeg.** Kijk op `/api/health`. Staat `staffRoles` op `0`, dan klopt
`DISCORD_STAFF_ROLES` niet (rol-ID's moeten alleen cijfers zijn). Staat `discord` op `false`, dan
ontbreekt het token of de server-ID. Blijft het misgaan: controleer of *Server Members Intent*
aanstaat en of de bot echt lid is van de server.

**De serverstatus zegt Offline terwijl de server draait.** Zoek je server op
https://servers.fivem.net. Staat hij daar niet, dan is `sv_master1` uitgeschakeld in je
`server.cfg`.
