# Alkmaar Roleplay — website

Website voor de FiveM-server **Alkmaar Roleplay**, met:

- live serverstatus (spelers, wachtrij, online/offline) via de Cfx.re-API
- teampagina die automatisch uit Discord komt, met avatar en naam per staflid
- ledenaantallen van de vier Discord-servers
- webshop met iDEAL, Bancontact en creditcard via Stripe
- melding van elke bestelling in een Discord-kanaal

Draait als één Node.js-applicatie. Geen database nodig.

Alle bestanden staan in deze ene map. De server-bestanden (`server.js`, `config.js`, `discord.js`,
`fivem.js`, `shop.js`, `payments.js`, `routes.js`, `cache.js`) draaien op de server en zijn voor
bezoekers niet opvraagbaar. Wat de bezoeker wél krijgt, staat in de lijst `PUBLIEKE_BESTANDEN`
onderaan `server.js`: de drie html-pagina's, `style.css`, `app.js` en de afbeeldingen.

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

Open http://localhost:3000. De site werkt meteen; het team en de winkel blijven leeg tot je de
stappen hieronder doorloopt.

---

## 2. Discord koppelen (team + ledenaantallen)

### 2.1 Maak een bot aan

1. Ga naar https://discord.com/developers/applications en klik **New Application**. Noem hem
   bijvoorbeeld *Alkmaar Website*.
2. Ga naar **Bot** in het linkermenu.
3. Klik **Reset Token** en kopieer het token. Dit is je `DISCORD_BOT_TOKEN`.
   Zie je het token maar één keer — bewaar het meteen goed en deel het met niemand.
4. Scroll op dezelfde pagina naar **Privileged Gateway Intents** en zet
   **SERVER MEMBERS INTENT** aan. Sla op.
   Zonder dit kan de bot je ledenlijst niet ophalen en blijft de teampagina leeg.

### 2.2 Nodig de bot uit in je server

1. Ga naar **OAuth2 → URL Generator**.
2. Vink bij *Scopes* aan: `bot`.
3. Bij *Bot Permissions* is **View Channels** genoeg. Meer heeft hij niet nodig.
4. Open de gegenereerde link en voeg de bot toe aan **Alkmaar Roleplay** (de hoofdserver).

### 2.3 Zoek de ID's op

Zet eerst de ontwikkelaarsmodus aan in Discord: **Instellingen → Geavanceerd → Ontwikkelaarsmodus**.

- **Server-ID**: rechtermuisknop op de servernaam → *Server-ID kopiëren*. Dit is `DISCORD_GUILD_ID`.
- **Rol-ID's**: **Serverinstellingen → Rollen**, rechtermuisknop op een rol → *Rol-ID kopiëren*.

### 2.4 Stel de staffrollen in

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

## 3. Serverstatus

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

## 4. Winkel en betalingen (Stripe)

Stripe is de eenvoudigste manier om iDEAL, Bancontact en kaartbetalingen te accepteren. Mollie kan
ook, maar dan moet je `payments.js` aanpassen.

1. Maak een account op https://dashboard.stripe.com en vul je bedrijfsgegevens in.
2. Ga naar **Instellingen → Betaalmethoden** en zet **iDEAL** en **Bancontact** aan.
   Doe je dat niet, haal ze dan uit `STRIPE_PAYMENT_METHODS`, anders faalt het afrekenen.
3. Ga naar **Developers → API keys** en kopieer de **Secret key** (`sk_live_...` of `sk_test_...`)
   naar `STRIPE_SECRET_KEY`.
4. Ga naar **Developers → Webhooks → Add endpoint**:
   - URL: `https://jouwdomein.nl/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Kopieer de **Signing secret** (`whsec_...`) naar `STRIPE_WEBHOOK_SECRET`.

Test eerst met de testsleutels en kaartnummer `4242 4242 4242 4242`, elke toekomstige datum en
willekeurige CVC.

### Producten aanpassen

Alles staat in **`shop.js`**. Prijzen in centen (`999` = € 9,99):

```js
{
  id: 'vip-zilver',          // uniek, wordt meegestuurd naar Stripe en Discord
  name: 'VIP Zilver',
  category: 'Lidmaatschap',  // kopjes in de winkel worden hieruit gemaakt
  price: 999,
  interval: 'per maand',     // laat weg voor eenmalige aankopen
  description: '…',
  perks: ['…', '…'],
  accent: 'roleplay',        // roleplay | overheid | support | onderwereld
  featured: true             // geeft de kaart nadruk
}
```

Bij het afrekenen vraagt Stripe om de Discord-naam en de naam van het karakter, zodat je weet wie
wat moet krijgen.

> **Let op:** dit zijn eenmalige betalingen, ook bij "per maand". Wil je echte automatische
> incasso, maak dan Prices aan in Stripe en zet `mode: 'subscription'` in `payments.js`.

### Bestellingen in Discord

Maak in je stafkanaal een webhook (**Kanaalinstellingen → Integraties → Webhooks → Nieuwe
webhook**), kopieer de URL naar `DISCORD_ORDER_WEBHOOK`. Bij elke geslaagde betaling komt daar een
bericht met pakket, bedrag, Discord-naam, karakternaam en e-mailadres.

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

1. Ga naar https://dashboard.render.com → **New → Web Service**.
2. Koppel je GitHub-account en kies deze repository.
3. Render leest `render.yaml` en vult het meeste zelf in. Controleer:
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Region**: Frankfurt (dichtstbij voor Nederlandse bezoekers)
4. Klik op **Environment** en voeg toe:

   | Variabele | Waarde |
   |---|---|
   | `SITE_URL` | `https://jouw-service.onrender.com` |
   | `DISCORD_BOT_TOKEN` | je bot-token |
   | `DISCORD_GUILD_ID` | ID van de hoofdserver |
   | `DISCORD_STAFF_ROLES` | `rolID:Naam:kleur,…` |
   | `DISCORD_ORDER_WEBHOOK` | webhook-URL (optioneel) |
   | `STRIPE_SECRET_KEY` | `sk_live_…` (optioneel) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` (optioneel) |

5. **Create Web Service**. De eerste build duurt een paar minuten.

Controleer daarna `https://jouw-service.onrender.com/api/health`. Je ziet dan of Discord en Stripe
herkend zijn en hoeveel staffrollen zijn ingelezen.

**Over het gratis pakket:** een gratis Render-service gaat na 15 minuten zonder bezoek in slaap. De
eerste bezoeker daarna wacht ongeveer 30 seconden. Voor een serieuze community is het betaalde
Starter-pakket (\$7 per maand) de moeite waard — dan blijft de site altijd wakker.

### Eigen domein

Onder **Settings → Custom Domains** voeg je bijvoorbeeld `alkmaarroleplay.nl` toe. Render laat zien
welke DNS-records je bij je domeinaanbieder moet zetten. Vergeet daarna niet `SITE_URL` bij te
werken, anders sturen de betaallinks je naar het oude adres.

---

## 7. Onderhoud

| Wat | Waar |
|---|---|
| Teksten en secties | `index.html` |
| Kleuren, lettertypes, opmaak | `style.css` |
| Producten en prijzen | `shop.js` |
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

**Afrekenen geeft een foutmelding.** Meestal is dat een betaalmethode die nog niet aanstaat in
Stripe. Zet `STRIPE_PAYMENT_METHODS=card` en probeer het opnieuw.
