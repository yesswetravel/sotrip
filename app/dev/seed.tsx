import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { Container, Text } from "../../features/design-system";
import { useSubscriptionStore } from "../../features/subscription/store";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import type { TripWithDaysAndItems, Trip } from "../../types/database";

const DEMO_TRIP_ID = "demo-paris-preview";
const TRIP_START = "2026-06-15";
const TRIP_END = "2026-06-24";

const DAY_TITLES = [
  "arrival & settling in",
  "classic paris",
  "art & culture",
  "montmartre & sacré-cœur",
  "versailles day trip",
  "le marais & shopping",
  "seine & islands",
  "day trip to giverny",
  "luxury & champs-élysées",
  "farewell paris",
];

type ItemSeed = {
  title: string;
  subtitle?: string;
  time?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  category?: string;
  notes?: string;
};

const DAY_ITEMS: ItemSeed[][] = [
  [
    { title: "land at CDG", subtitle: "air france AF1680", time: "10:30", location_name: "Charles de Gaulle Airport", location_lat: 49.0097, location_lng: 2.5479, category: "transport", notes: "terminal 2E, grab SIM card at relay" },
    { title: "taxi to hotel", time: "11:30", location_name: "Hotel Le Marais", location_lat: 48.8566, location_lng: 2.3522, category: "transport", notes: "pre-booked via hotel, ~€55" },
    { title: "check in & freshen up", time: "12:30", location_name: "Hôtel du Petit Moulin", location_lat: 48.8637, location_lng: 2.3615, category: "hotel", notes: "boutique hotel in le marais, christian lacroix designed interiors" },
    { title: "lunch at café de flore", subtitle: "classic french brasserie", time: "14:00", location_name: "Café de Flore", location_lat: 48.8540, location_lng: 2.3325, category: "dining", notes: "croque monsieur + café crème, sit outside" },
    { title: "walk along seine", subtitle: "first golden hour stroll", time: "16:00", location_name: "Pont des Arts", location_lat: 48.8583, location_lng: 2.3376, category: "sightseeing", notes: "love locks bridge, great photo spot" },
    { title: "sunset at trocadéro", subtitle: "eiffel tower views", time: "19:00", location_name: "Trocadéro", location_lat: 48.8622, location_lng: 2.2885, category: "sightseeing", notes: "best eiffel tower photo angle, arrive 30 min before sunset" },
    { title: "dinner at le comptoir", time: "21:00", location_name: "Le Comptoir du Panthéon", location_lat: 48.8462, location_lng: 2.3464, category: "dining", notes: "duck confit, book ahead" },
  ],
  [
    { title: "croissants at du pain et des idées", time: "08:30", location_name: "Du Pain et des Idées", location_lat: 48.8710, location_lng: 2.3614, category: "dining", notes: "famous pain des amis, arrive early — sells out" },
    { title: "eiffel tower climb", subtitle: "skip-the-line tickets", time: "10:00", location_name: "Eiffel Tower", location_lat: 48.8584, location_lng: 2.2945, category: "sightseeing", notes: "take stairs to 2nd floor, elevator to top. tickets pre-booked" },
    { title: "picnic at champ de mars", time: "12:30", location_name: "Champ de Mars", location_lat: 48.8556, location_lng: 2.2986, category: "dining", notes: "stop at rue cler market for baguette, cheese, wine" },
    { title: "arc de triomphe", subtitle: "rooftop panorama", time: "14:30", location_name: "Arc de Triomphe", location_lat: 48.8738, location_lng: 2.2950, category: "sightseeing", notes: "284 steps to top, 360° paris views" },
    { title: "stroll champs-élysées", time: "16:00", location_name: "Champs-Élysées", location_lat: 48.8698, location_lng: 2.3078, category: "shopping", notes: "window shopping, ladurée for macarons" },
    { title: "seine river cruise", subtitle: "bateaux mouches", time: "18:30", location_name: "Bateaux Mouches", location_lat: 48.8641, location_lng: 2.3056, category: "activity", notes: "1 hour cruise, golden hour light on buildings" },
    { title: "dinner at bouillon chartier", time: "20:30", location_name: "Bouillon Chartier", location_lat: 48.8747, location_lng: 2.3440, category: "dining", notes: "historic belle époque dining hall, very affordable" },
  ],
  [
    { title: "breakfast at hôtel", time: "08:00", category: "dining", notes: "hotel breakfast included" },
    { title: "louvre museum", subtitle: "mona lisa & beyond", time: "09:30", location_name: "Musée du Louvre", location_lat: 48.8606, location_lng: 2.3376, category: "sightseeing", notes: "enter via carrousel du louvre (less queue). must-see: winged victory, venus de milo, mona lisa" },
    { title: "lunch at café marly", time: "13:00", location_name: "Café Marly", location_lat: 48.8611, location_lng: 2.3358, category: "dining", notes: "overlooking louvre pyramid, splurge-worthy" },
    { title: "musée d'orsay", subtitle: "impressionist masterpieces", time: "14:30", location_name: "Musée d'Orsay", location_lat: 48.8600, location_lng: 2.3266, category: "sightseeing", notes: "monet, renoir, van gogh. clock face view is magical" },
    { title: "coffee at shakespeare & co", time: "17:00", location_name: "Shakespeare and Company", location_lat: 48.8526, location_lng: 2.3472, category: "coffee", notes: "iconic english bookshop, café next door. get a stamp" },
    { title: "walk through latin quarter", time: "18:00", location_name: "Quartier Latin", location_lat: 48.8500, location_lng: 2.3450, category: "sightseeing" },
    { title: "dinner at chez janou", time: "20:00", location_name: "Chez Janou", location_lat: 48.8570, location_lng: 2.3640, category: "dining", notes: "famous chocolate mousse, provençal cuisine" },
  ],
  [
    { title: "coffee at kb café", time: "09:00", location_name: "KB CaféShop", location_lat: 48.8819, location_lng: 2.3374, category: "coffee", notes: "specialty coffee near montmartre" },
    { title: "sacré-cœur basilica", subtitle: "hilltop views of paris", time: "10:00", location_name: "Sacré-Cœur", location_lat: 48.8867, location_lng: 2.3431, category: "sightseeing", notes: "take funicular up, walk down. free entry, dome climb €7" },
    { title: "wander place du tertre", subtitle: "artists' square", time: "11:30", location_name: "Place du Tertre", location_lat: 48.8863, location_lng: 2.3409, category: "sightseeing", notes: "get a portrait drawn, watch painters work" },
    { title: "lunch at le consulat", time: "13:00", location_name: "Le Consulat", location_lat: 48.8862, location_lng: 2.3396, category: "dining", notes: "picturesque corner café, crêpes & omelettes" },
    { title: "moulin rouge photo stop", time: "14:30", location_name: "Moulin Rouge", location_lat: 48.8841, location_lng: 2.3322, category: "sightseeing", notes: "just photos outside, show tickets optional (€87+)" },
    { title: "wall of love", time: "15:00", location_name: "Le Mur des Je t'aime", location_lat: 48.8843, location_lng: 2.3383, category: "sightseeing", notes: "\"i love you\" in 250 languages, romantic photo spot" },
    { title: "sunset drinks at le perchoir", time: "18:30", location_name: "Le Perchoir", location_lat: 48.8672, location_lng: 2.3805, category: "nightlife", notes: "rooftop bar, cocktails with east paris views" },
    { title: "dinner at pink mamma", time: "20:30", location_name: "Pink Mamma", location_lat: 48.8668, location_lng: 2.3793, category: "dining", notes: "5-story italian restaurant, truffle pasta is incredible. no reservations — arrive early" },
  ],
  [
    { title: "early train to versailles", time: "08:00", location_name: "Gare Montparnasse", location_lat: 48.8414, location_lng: 2.3209, category: "transport", notes: "RER C to Versailles Rive Gauche, ~40 min. buy navigo pass" },
    { title: "palace of versailles", subtitle: "hall of mirrors", time: "09:30", location_name: "Château de Versailles", location_lat: 48.8049, location_lng: 2.1204, category: "sightseeing", notes: "pre-book timed entry. hall of mirrors, king's apartments, chapel" },
    { title: "gardens & petit trianon", time: "12:00", location_name: "Gardens of Versailles", location_lat: 48.8048, location_lng: 2.1148, category: "sightseeing", notes: "rent a golf cart (€32/hr) to cover the vast gardens. marie antoinette's hamlet" },
    { title: "lunch at la petite venise", time: "13:30", location_name: "La Petite Venise", location_lat: 48.8045, location_lng: 2.1150, category: "dining", notes: "lakeside restaurant in the gardens" },
    { title: "grand trianon", time: "15:00", location_name: "Grand Trianon", location_lat: 48.8135, location_lng: 2.1061, category: "sightseeing", notes: "pink marble palace, less crowded than main château" },
    { title: "train back to paris", time: "17:00", category: "transport" },
    { title: "light dinner at le bouillon", time: "19:30", location_name: "Le Bouillon", location_lat: 48.8566, location_lng: 2.3522, category: "dining", notes: "classic french comfort food, rest those tired feet" },
  ],
  [
    { title: "brunch at café charlot", time: "09:30", location_name: "Café Charlot", location_lat: 48.8649, location_lng: 2.3625, category: "dining", notes: "eggs benedict & fresh juice, people-watching on terrace" },
    { title: "explore le marais boutiques", subtitle: "vintage & designer shops", time: "11:00", location_name: "Le Marais", location_lat: 48.8570, location_lng: 2.3615, category: "shopping", notes: "merci concept store, free'p'star vintage, kilo shop" },
    { title: "falafel at l'as du fallafel", time: "13:00", location_name: "L'As du Fallafel", location_lat: 48.8577, location_lng: 2.3583, category: "dining", notes: "best falafel in paris, rue des rosiers. long queue but worth it" },
    { title: "place des vosges", subtitle: "oldest square in paris", time: "14:30", location_name: "Place des Vosges", location_lat: 48.8554, location_lng: 2.3656, category: "sightseeing", notes: "sit on the grass, gelato from nearby shop" },
    { title: "galeries lafayette rooftop", time: "16:00", location_name: "Galeries Lafayette", location_lat: 48.8738, location_lng: 2.3320, category: "shopping", notes: "free rooftop terrace with opera garnier views. art nouveau dome inside" },
    { title: "spa break at hammam", time: "17:30", location_name: "Les Bains du Marais", location_lat: 48.8621, location_lng: 2.3595, category: "wellness", notes: "turkish bath + massage, pre-book couples slot" },
    { title: "dinner at breizh café", time: "20:00", location_name: "Breizh Café", location_lat: 48.8602, location_lng: 2.3608, category: "dining", notes: "best crêpes & galettes in paris, organic buckwheat" },
  ],
  [
    { title: "morning yoga in tuileries", time: "07:30", location_name: "Jardin des Tuileries", location_lat: 48.8634, location_lng: 2.3275, category: "wellness", notes: "free outdoor session near the pond" },
    { title: "breakfast at angelina", time: "09:00", location_name: "Angelina Paris", location_lat: 48.8651, location_lng: 2.3286, category: "dining", notes: "famous hot chocolate (chocolat l'africain) & mont blanc pastry" },
    { title: "île de la cité walk", time: "10:30", location_name: "Île de la Cité", location_lat: 48.8554, location_lng: 2.3488, category: "sightseeing", notes: "sainte-chapelle stained glass, conciergerie" },
    { title: "sainte-chapelle", subtitle: "gothic stained glass", time: "11:00", location_name: "Sainte-Chapelle", location_lat: 48.8554, location_lng: 2.3449, category: "sightseeing", notes: "1,113 stained glass panels, best on sunny days. pre-book" },
    { title: "lunch on île saint-louis", time: "13:00", location_name: "Île Saint-Louis", location_lat: 48.8519, location_lng: 2.3565, category: "dining", notes: "berthillon ice cream is a must. any café on the island" },
    { title: "notre-dame exterior", subtitle: "reconstruction viewing", time: "14:30", location_name: "Notre-Dame de Paris", location_lat: 48.8530, location_lng: 2.3499, category: "sightseeing", notes: "reopened after restoration, check current access" },
    { title: "bouquinistes browsing", subtitle: "riverside booksellers", time: "16:00", location_name: "Les Bouquinistes", location_lat: 48.8530, location_lng: 2.3440, category: "shopping", notes: "UNESCO heritage green stalls along the seine. vintage prints" },
    { title: "dinner cruise on the seine", time: "20:00", location_name: "Marina de Paris", location_lat: 48.8600, location_lng: 2.3300, category: "dining", notes: "3-course dinner, 2.5 hours, paris lit up at night. pre-booked" },
  ],
  [
    { title: "train to vernon", time: "08:15", location_name: "Gare Saint-Lazare", location_lat: 48.8765, location_lng: 2.3258, category: "transport", notes: "direct train ~45 min, then shuttle bus to giverny" },
    { title: "monet's garden", subtitle: "water lilies & japanese bridge", time: "10:00", location_name: "Fondation Claude Monet", location_lat: 49.0757, location_lng: 1.5334, category: "sightseeing", notes: "arrive right at opening. water garden first (fewer crowds), then flower garden" },
    { title: "monet's house tour", time: "11:30", location_name: "Maison de Claude Monet", location_lat: 49.0757, location_lng: 1.5334, category: "sightseeing", notes: "blue kitchen, japanese prints collection, studio" },
    { title: "lunch at le jardin des plumes", time: "13:00", location_name: "Le Jardin des Plumes", location_lat: 49.0760, location_lng: 1.5330, category: "dining", notes: "michelin-starred garden restaurant. set menu ~€45" },
    { title: "musée des impressionnismes", time: "14:30", location_name: "Musée des Impressionnismes", location_lat: 49.0750, location_lng: 1.5320, category: "sightseeing", notes: "small but lovely museum, rotating impressionist exhibits" },
    { title: "train back to paris", time: "16:30", category: "transport" },
    { title: "relaxed evening at hotel", time: "18:30", category: "hotel", notes: "rest, pack laundry, plan last 2 days" },
    { title: "late dinner at le petit cler", time: "20:30", location_name: "Le Petit Cler", location_lat: 48.8558, location_lng: 2.3091, category: "dining", notes: "neighborhood bistro in the 7th, warm atmosphere" },
  ],
  [
    { title: "pastries at cédric grolet", time: "09:00", location_name: "Cédric Grolet Opéra", location_lat: 48.8718, location_lng: 2.3310, category: "dining", notes: "world-famous fruit trompe l'oeil pastries. queue early" },
    { title: "palais garnier opera house", subtitle: "guided tour", time: "10:30", location_name: "Palais Garnier", location_lat: 48.8720, location_lng: 2.3316, category: "sightseeing", notes: "phantom of the opera inspiration, chagall ceiling, grand staircase" },
    { title: "shopping at le bon marché", time: "12:30", location_name: "Le Bon Marché", location_lat: 48.8502, location_lng: 2.3246, category: "shopping", notes: "paris' oldest department store, la grande épicerie food hall next door" },
    { title: "lunch at la grande épicerie", time: "13:30", location_name: "La Grande Épicerie", location_lat: 48.8498, location_lng: 2.3242, category: "dining", notes: "gourmet food hall, pick up gifts & souvenirs here too" },
    { title: "jardins du luxembourg", subtitle: "afternoon stroll", time: "15:00", location_name: "Jardin du Luxembourg", location_lat: 48.8462, location_lng: 2.3372, category: "sightseeing", notes: "medici fountain, toy sailboats on the pond, people-watching" },
    { title: "cocktails at bar hemingway", time: "18:00", location_name: "Bar Hemingway, Ritz Paris", location_lat: 48.8681, location_lng: 2.3285, category: "nightlife", notes: "legendary bar at the ritz, €25+ cocktails but iconic experience" },
    { title: "farewell dinner at le jules verne", time: "20:30", location_name: "Le Jules Verne", location_lat: 48.8584, location_lng: 2.2945, category: "dining", notes: "michelin-starred restaurant in the eiffel tower. once-in-a-lifetime. booked 3 months ago" },
  ],
  [
    { title: "last breakfast at hôtel", time: "08:00", category: "dining", notes: "savor every last croissant" },
    { title: "morning walk through tuileries", time: "09:30", location_name: "Jardin des Tuileries", location_lat: 48.8634, location_lng: 2.3275, category: "sightseeing", notes: "one last peaceful walk, photos by the fountain" },
    { title: "souvenir shopping at merci", time: "10:30", location_name: "Merci", location_lat: 48.8636, location_lng: 2.3628, category: "shopping", notes: "concept store, pick up gifts. used book café inside" },
    { title: "checkout & luggage storage", time: "12:00", category: "hotel", notes: "store bags at hotel, explore light" },
    { title: "last lunch at le relais de l'entrecôte", time: "12:30", location_name: "Le Relais de l'Entrecôte", location_lat: 48.8530, location_lng: 2.3298, category: "dining", notes: "no menu — just steak frites with secret sauce. perfect final parisian meal" },
    { title: "taxi to CDG", time: "15:00", location_name: "Charles de Gaulle Airport", location_lat: 49.0097, location_lng: 2.5479, category: "transport", notes: "allow 1.5 hrs for traffic, check-in 3 hrs before" },
    { title: "flight home", subtitle: "au revoir, paris ✦", time: "18:30", location_name: "CDG Terminal 2E", location_lat: 49.0097, location_lng: 2.5479, category: "transport", notes: "duty free last chance for wine & chocolate" },
  ],
];

const DAY_NOTES: (string | null)[] = [
  "first impressions of paris — the light really is different here. that golden hour on the seine was everything.",
  "my legs are already tired but the views from the eiffel tower were worth every step. those macarons from ladurée though!",
  "the louvre was overwhelming in the best way. could have spent 3 days there. the clock face at d'orsay is unforgettable.",
  "montmartre feels like a different city. the wall of love made us both tear up a little. pink mamma was INCREDIBLE.",
  "versailles exceeded every expectation. the hall of mirrors at golden hour... no photo can capture it.",
  "le marais is my favorite neighborhood. the falafel, the boutiques, that hammam spa — absolute bliss.",
  "sainte-chapelle on a sunny day is pure magic. the dinner cruise was the most romantic thing we've ever done.",
  "monet's garden in real life hits different. you can feel why he painted those water lilies hundreds of times.",
  "splurge day done right. le jules verne dinner was the highlight of the entire trip.",
  "bittersweet last morning. paris, we'll be back. this city has our hearts.",
];

const OUTFIT_DATA = [
  { name: "arrival chic", notes: "black wide-leg trousers, cream silk blouse, tan trench coat, white sneakers", dayNumber: 1 as number | null },
  { name: "classic tourist", notes: "high-waist jeans, breton stripe top, navy blazer, white keds, red lip", dayNumber: 2 as number | null },
  { name: "museum day", notes: "black midi skirt, tucked white tee, gold necklace, ballet flats, crossbody bag", dayNumber: 3 as number | null },
  { name: "montmartre vibes", notes: "flowy floral dress, denim jacket, espadrilles, straw bag, beret (yes really)", dayNumber: 4 as number | null },
  { name: "versailles grandeur", notes: "linen wide trousers, eyelet top, block heels, structured bag, pearls", dayNumber: 5 as number | null },
  { name: "marais shopping", notes: "vintage high-waist shorts, tucked blouse, sandals, basket bag, gold hoops", dayNumber: 6 as number | null },
  { name: "river romance", notes: "slip dress in sage green, cashmere cardigan, strappy heels, clutch, perfume", dayNumber: 7 as number | null },
  { name: "giverny garden", notes: "linen jumpsuit in blush, white sneakers, sun hat, canvas tote, minimal jewelry", dayNumber: 8 as number | null },
  { name: "luxury evening", notes: "little black dress, statement earrings, heeled mules, silk wrap, red clutch", dayNumber: 9 as number | null },
  { name: "travel home", notes: "comfy joggers, oversized cashmere sweater, slip-on sneakers, baseball cap", dayNumber: 10 as number | null },
  { name: "rainy day backup", notes: "black turtleneck, tailored coat, waterproof chelsea boots, umbrella, scarf", dayNumber: null },
  { name: "night out alt", notes: "leather pants, silk cami, blazer, ankle boots, bold lip", dayNumber: null },
];

const PACKING_ITEMS = [
  { text: "breton stripe top", packed: true, category: "clothes" },
  { text: "cream silk blouse", packed: true, category: "clothes" },
  { text: "black wide-leg trousers (×2)", packed: true, category: "clothes" },
  { text: "high-waist jeans", packed: true, category: "clothes" },
  { text: "flowy floral dress", packed: true, category: "clothes" },
  { text: "slip dress (sage green)", packed: true, category: "clothes" },
  { text: "little black dress", packed: true, category: "clothes" },
  { text: "linen jumpsuit (blush)", packed: true, category: "clothes" },
  { text: "denim jacket", packed: true, category: "clothes" },
  { text: "tan trench coat", packed: true, category: "clothes" },
  { text: "cashmere cardigan", packed: true, category: "clothes" },
  { text: "navy blazer", packed: false, category: "clothes" },
  { text: "vintage shorts", packed: false, category: "clothes" },
  { text: "eyelet top", packed: false, category: "clothes" },
  { text: "white tees (×3)", packed: true, category: "clothes" },
  { text: "comfy joggers", packed: false, category: "clothes" },
  { text: "oversized cashmere sweater", packed: false, category: "clothes" },
  { text: "white sneakers", packed: true, category: "clothes" },
  { text: "ballet flats", packed: true, category: "clothes" },
  { text: "espadrilles", packed: false, category: "clothes" },
  { text: "heeled mules", packed: false, category: "clothes" },
  { text: "strappy heels", packed: false, category: "clothes" },
  { text: "underwear (10 days)", packed: true, category: "clothes" },
  { text: "bras (×4)", packed: true, category: "clothes" },
  { text: "swimsuit", packed: false, category: "clothes" },
  { text: "pajamas", packed: true, category: "clothes" },
  { text: "socks (10 pairs)", packed: true, category: "clothes" },
  { text: "sun hat", packed: false, category: "clothes" },
  { text: "silk scarf", packed: false, category: "clothes" },
  { text: "sunscreen SPF 50", packed: true, category: "toiletries" },
  { text: "moisturizer", packed: true, category: "toiletries" },
  { text: "cleanser + toner", packed: true, category: "toiletries" },
  { text: "shampoo & conditioner (travel)", packed: true, category: "toiletries" },
  { text: "dry shampoo", packed: false, category: "toiletries" },
  { text: "toothbrush & toothpaste", packed: true, category: "toiletries" },
  { text: "deodorant", packed: true, category: "toiletries" },
  { text: "makeup bag", packed: true, category: "toiletries" },
  { text: "perfume (travel size)", packed: false, category: "toiletries" },
  { text: "hair ties & clips", packed: true, category: "toiletries" },
  { text: "mini first aid kit", packed: false, category: "toiletries" },
  { text: "lip balm SPF", packed: true, category: "toiletries" },
  { text: "phone + charger", packed: true, category: "electronics" },
  { text: "camera + extra battery", packed: true, category: "electronics" },
  { text: "portable power bank", packed: true, category: "electronics" },
  { text: "EU plug adapter (×2)", packed: true, category: "electronics" },
  { text: "kindle", packed: false, category: "electronics" },
  { text: "airpods", packed: true, category: "electronics" },
  { text: "travel hair dryer", packed: false, category: "electronics" },
  { text: "passport", packed: true, category: "documents" },
  { text: "travel insurance printout", packed: true, category: "documents" },
  { text: "hotel confirmation", packed: true, category: "documents" },
  { text: "flight tickets (digital)", packed: true, category: "documents" },
  { text: "museum pre-booked tickets", packed: false, category: "documents" },
  { text: "emergency contacts card", packed: true, category: "documents" },
  { text: "credit cards (×2) + cash €200", packed: true, category: "documents" },
  { text: "reusable water bottle", packed: true, category: "other" },
  { text: "tote bag for shopping", packed: true, category: "other" },
  { text: "travel umbrella", packed: false, category: "other" },
  { text: "neck pillow for flight", packed: false, category: "other" },
  { text: "snacks for flight", packed: false, category: "other" },
  { text: "packing cubes", packed: true, category: "other" },
  { text: "laundry bag", packed: true, category: "other" },
];

const BUDGET_ENTRIES = [
  { label: "round-trip flights", amount: 890, category: "flights", paid: true },
  { label: "hôtel du petit moulin (10 nights)", amount: 2800, category: "accommodation", paid: true },
  { label: "CDG taxi transfer", amount: 55, category: "transport", paid: false },
  { label: "navigo weekly pass", amount: 30, category: "transport", paid: false },
  { label: "versailles train", amount: 14, category: "transport", paid: false },
  { label: "giverny train + shuttle", amount: 28, category: "transport", paid: false },
  { label: "CDG return taxi", amount: 55, category: "transport", paid: false },
  { label: "eiffel tower tickets (×2)", amount: 52, category: "activities", paid: true },
  { label: "louvre tickets (×2)", amount: 36, category: "activities", paid: true },
  { label: "musée d'orsay tickets (×2)", amount: 32, category: "activities", paid: true },
  { label: "versailles tickets (×2)", amount: 42, category: "activities", paid: true },
  { label: "sainte-chapelle (×2)", amount: 22, category: "activities", paid: true },
  { label: "monet's garden (×2)", amount: 20, category: "activities", paid: true },
  { label: "palais garnier tour (×2)", amount: 28, category: "activities", paid: true },
  { label: "seine dinner cruise (×2)", amount: 198, category: "activities", paid: true },
  { label: "spa at les bains du marais", amount: 120, category: "activities", paid: false },
  { label: "le jules verne dinner", amount: 380, category: "food", paid: true },
  { label: "daily meals budget (9 days)", amount: 720, category: "food", paid: false },
  { label: "café & pastries budget", amount: 150, category: "food", paid: false },
  { label: "shopping allowance", amount: 400, category: "shopping", paid: false },
  { label: "souvenirs & gifts", amount: 150, category: "shopping", paid: false },
  { label: "travel insurance", amount: 85, category: "other", paid: true },
  { label: "SIM card", amount: 20, category: "other", paid: false },
];

const NOTES_DATA = [
  { title: "restaurant reservations", body: "le jules verne — jun 24, 8:30pm (conf #JV-28491)\nchez janou — jun 17, 8pm\nbouillon chartier — walk-in only\nbreizh café — jun 20, 8pm\nle relais de l'entrecôte — walk-in, arrive by 12:15", color: "#F7F2E2", pinned: true },
  { title: "french phrases", body: "bonjour — hello\nmerci beaucoup — thank you very much\nl'addition, s'il vous plaît — the check, please\nparlez-vous anglais? — do you speak english?\nje voudrais... — i would like...\noù sont les toilettes? — where are the restrooms?\nc'est magnifique! — it's magnificent!", color: "#DED7C5", pinned: true },
  { title: "gift ideas", body: "mom — lavender soap from a pharmacie\ndad — bottle of burgundy wine\nsis — macarons from ladurée (tin box)\nbest friend — vintage print from bouquinistes\ncoworker — fancy mustard from la grande épicerie", color: "#B8956A14", pinned: false },
  { title: "photography spots", body: "1. trocadéro at golden hour (eiffel tower)\n2. pont alexandre III (ornate bridge)\n3. rue crémieux (colorful houses)\n4. louvre pyramid reflection at night\n5. sacré-cœur steps looking over paris\n6. café de flore terrace\n7. palais royal columns\n8. pont des arts at sunset", color: "#4A6E6B14", pinned: false },
  { title: "metro tips", body: "line 1 & 14 are driverless (smooth ride)\navoid line 13 at rush hour\nalways validate ticket before boarding RER\nkeep bags in front on metro (pickpockets)\nuber is sometimes cheaper than taxi for 2\ncitymapper app works great for routes", color: "#D8756014", pinned: false },
  { title: "rainy day backup plan", body: "option A: musée de l'orangerie (monet water lilies room)\noption B: covered passages — galerie vivienne, passage des panoramas\noption C: cooking class at le cordon bleu\noption D: wine tasting at ô chateau\noption E: catacombs (book ahead)", color: "#F7F2E2", pinned: false },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildMockTrip(): TripWithDaysAndItems {
  const now = new Date().toISOString();
  const dates: string[] = [];
  const current = new Date(TRIP_START);
  const last = new Date(TRIP_END);
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const trip_days = dates.map((date, i) => ({
    id: `demo-day-${i + 1}`,
    trip_id: DEMO_TRIP_ID,
    day_number: i + 1,
    date,
    title: DAY_TITLES[i] || null,
    notes: DAY_NOTES[i] || null,
    trip_items: (DAY_ITEMS[i] || []).map((item, j) => ({
      id: `demo-item-${i + 1}-${j}`,
      trip_day_id: `demo-day-${i + 1}`,
      sort_order: j,
      title: item.title,
      subtitle: item.subtitle ?? null,
      time: item.time ?? null,
      location_name: item.location_name ?? null,
      location_lat: item.location_lat ?? null,
      location_lng: item.location_lng ?? null,
      category: item.category ?? null,
      notes: item.notes ?? null,
      link: null,
      photo_uri: null,
      assigned_to: [],
      created_at: now,
    })),
  }));

  return {
    id: DEMO_TRIP_ID,
    owner_id: "demo-user",
    title: "paris, france",
    destination: "Paris, France",
    start_date: TRIP_START,
    end_date: TRIP_END,
    cover_photo_url: null,
    is_archived: false,
    created_at: now,
    updated_at: now,
    trip_days,
  };
}

export default function SeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setTier = useSubscriptionStore((s) => s.setTier);
  const [status, setStatus] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  async function seedPreview() {
    setSeeding(true);

    try {
      setStatus("switching to paid tier...");
      setTier("paid");

      setStatus("building mock trip data...");
      const mockTrip = buildMockTrip();

      // Inject into React Query cache (no Supabase)
      queryClient.setQueryData(["trip", DEMO_TRIP_ID], mockTrip);

      // Also inject into trips list so home screen shows it
      const mockTripSummary: Trip = {
        id: mockTrip.id,
        owner_id: mockTrip.owner_id,
        title: mockTrip.title,
        destination: mockTrip.destination,
        start_date: mockTrip.start_date,
        end_date: mockTrip.end_date,
        cover_photo_url: null,
        is_archived: false,
        created_at: mockTrip.created_at,
        updated_at: mockTrip.updated_at,
      };
      const existingTrips = queryClient.getQueryData<Trip[]>(["trips", undefined]) || [];
      queryClient.setQueryData(["trips", undefined], [...existingTrips, mockTripSummary]);

      // Prevent React Query from refetching and overwriting our mock data
      queryClient.setQueryDefaults(["trip", DEMO_TRIP_ID], {
        staleTime: Infinity,
        gcTime: Infinity,
      });

      setStatus("saving outfits...");
      const outfits = OUTFIT_DATA.map((o) => ({
        id: uid(),
        photoUri: "",
        name: o.name,
        notes: o.notes,
        dayNumber: o.dayNumber,
        createdAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(`outfits_${DEMO_TRIP_ID}`, JSON.stringify(outfits));

      setStatus("saving packing list...");
      const packingItems = PACKING_ITEMS.map((p) => ({
        id: uid(),
        text: p.text,
        packed: p.packed,
        category: p.category,
      }));
      await AsyncStorage.setItem(`packing_${DEMO_TRIP_ID}`, JSON.stringify(packingItems));

      setStatus("saving budget...");
      const budgetEntries = BUDGET_ENTRIES.map((b) => ({
        id: uid(),
        label: b.label,
        amount: b.amount,
        category: b.category,
        paid: b.paid,
      }));
      await AsyncStorage.setItem(`budget_${DEMO_TRIP_ID}`, JSON.stringify(budgetEntries));
      await AsyncStorage.setItem(`budget_limit_${DEMO_TRIP_ID}`, "6500");

      setStatus("saving notes...");
      const now = new Date().toISOString();
      const notes = NOTES_DATA.map((n, i) => ({
        id: uid(),
        title: n.title,
        body: n.body,
        color: n.color,
        pinned: n.pinned,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        updatedAt: now,
      }));
      await AsyncStorage.setItem(`notes_${DEMO_TRIP_ID}`, JSON.stringify(notes));

      setStatus("done! opening trip...");
      setDone(true);
      setTimeout(() => router.push(`/trip/${DEMO_TRIP_ID}`), 800);
    } catch (err: any) {
      setStatus(`error: ${err.message}`);
      setSeeding(false);
    }
  }

  return (
    <Container safe>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.icon, { color: colors.coral }]}>✦</Text>
          <Text variant="display">preview demo</Text>
          <Text variant="body" style={[styles.subtitle, { color: colors.stone }]}>
            preview a complete 10-day paris trip with 70+ activities, outfit planning, packing list, budget tracking, and travel notes — all local, nothing saved to database
          </Text>
        </View>

        <View style={[styles.preview, { backgroundColor: colors.pearl }]}>
          <Text variant="eyebrow" style={[styles.previewLabel, { color: colors.sand }]}>what you'll see</Text>
          <View style={styles.previewList}>
            {[
              ["map-pin", "10 days of activities with times & locations"],
              ["shopping-bag", "12 curated outfit plans (10 days + 2 extras)"],
              ["check-square", "60+ packing items across 5 categories"],
              ["dollar-sign", "$6,500 budget with 23 expense items"],
              ["file-text", "6 travel notes (restaurants, phrases, tips)"],
              ["camera", "8 photography spots marked"],
            ].map(([icon, text]) => (
              <View key={text} style={styles.previewRow}>
                <Feather name={icon as any} size={14} color={colors.teal} />
                <Text variant="body" style={[styles.previewText, { color: colors.ink }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {status ? (
          <View style={[styles.statusBox, { backgroundColor: colors.mist }]}>
            <Text variant="caption" style={[styles.statusText, { color: colors.stone }]}>{status}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.seedBtn, { backgroundColor: colors.coral }, (seeding || done) && styles.seedBtnDisabled]}
          onPress={seedPreview}
          activeOpacity={0.85}
          disabled={seeding || done}
        >
          <Feather name={done ? "check" : "eye"} size={16} color={colors.ivory} />
          <Text variant="body" style={[styles.seedBtnText, { color: colors.ivory }]}>
            {done ? "opening..." : seeding ? "loading..." : "preview paris trip"}
          </Text>
        </TouchableOpacity>

        <Text variant="caption" style={[styles.note, { color: colors.sand }]}>
          local preview only — nothing is saved to the database.{"\n"}
          data disappears when you refresh the app.
        </Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: 8,
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  preview: {
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: 12,
  },
  previewLabel: {
    marginBottom: 4,
  },
  previewList: {
    gap: 10,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewText: {
    flex: 1,
  },
  statusBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  statusText: {
  },
  seedBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  seedBtnDisabled: {
    opacity: 0.6,
  },
  seedBtnText: {
    fontFamily: "Inter_500Medium",
  },
  note: {
    textAlign: "center",
    lineHeight: 18,
  },
});
