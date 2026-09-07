/**
 * De webshop. Pas hier gerust alles aan: prijzen staan in centen (999 = € 9,99).
 * `id` moet uniek blijven en wordt meegestuurd naar Stripe en naar je Discord-kanaal.
 */
export const products = [
  {
    id: 'vip-brons',
    name: 'VIP Brons',
    category: 'Lidmaatschap',
    price: 499,
    interval: 'per maand',
    description: 'Voorrang in de wachtrij, bronzen naamkleur in Discord en een eigen kentekenplaat.',
    perks: ['Priority queue', 'Naamkleur in Discord', 'Eigen kenteken'],
    accent: 'onderwereld',
  },
  {
    id: 'vip-zilver',
    name: 'VIP Zilver',
    category: 'Lidmaatschap',
    price: 999,
    interval: 'per maand',
    description: 'Alles uit Brons, plus een tweede garageplek en toegang tot het VIP-kanaal.',
    perks: ['Alles uit Brons', 'Extra garageplek', 'VIP-kanaal'],
    accent: 'roleplay',
    featured: true,
  },
  {
    id: 'vip-goud',
    name: 'VIP Goud',
    category: 'Lidmaatschap',
    price: 1999,
    interval: 'per maand',
    description: 'De hoogste rang: hoogste voorrang, drie garageplekken en maandelijks een voertuigkorting.',
    perks: ['Hoogste voorrang', 'Drie garageplekken', '10% korting op voertuigen'],
    accent: 'overheid',
  },
  {
    id: 'startpakket',
    name: 'Startpakket',
    category: 'In-game',
    price: 749,
    description: 'Een eenmalige boost voor nieuwe inwoners: startgeld, een telefoon en een instapvoertuig.',
    perks: ['€ 25.000 in-game', 'Telefoon', 'Instapvoertuig'],
    accent: 'support',
  },
  {
    id: 'bedrijfsvergunning',
    name: 'Bedrijfsvergunning',
    category: 'In-game',
    price: 2499,
    description: 'Start je eigen zaak in de stad. Wordt handmatig ingesteld na overleg met de staff.',
    perks: ['Eigen pand', 'Personeelssysteem', 'Bedrijfskluis'],
    accent: 'onderwereld',
  },
  {
    id: 'steun-de-stad',
    name: 'Steun de stad',
    category: 'Donatie',
    price: 500,
    description: 'Een vrije bijdrage aan de serverkosten. Geen voordelen in het spel, wel onze dank.',
    perks: ['Donateursrol in Discord'],
    accent: 'roleplay',
  },
];

export function findProduct(id) {
  return products.find((p) => p.id === id);
}

export const categories = [...new Set(products.map((p) => p.category))];
