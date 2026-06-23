import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Brain, BookOpen, Globe, FolderOpen, Calendar, BarChart3, Settings, ClipboardList,
  ChevronLeft, Mic, CheckCircle2, XCircle, Star, Lock, PlayCircle, Volume2,
  FileText, Headphones, Video, Download, ChevronRight, Flag, Sparkles,
  BookOpenText, GraduationCap, Timer, RotateCcw, Home, Search, Bookmark, User
} from 'lucide-react';

// ==================== TYPES ====================
type View = 'menu' | 'ai_mentor' | 'vorstellung' | 'aktiv_sprechen' | 'aktiv_topic' | 'aktiv_words' | 'aktiv_story'
  | 'lugat' | 'lugat_chapters' | 'lugat_words'
  | 'tarjimon'
  | 'sayfa' | 'sayfa_files'
  | 'kitob' | 'kitob_books' | 'kitob_files'
  | 'kunlik_soz'
  | 'progressim'
  | 'sozlamalar'
  | 'test' | 'test_levels' | 'test_sections' | 'test_active' | 'test_result';

type Level = 'a1' | 'a2' | 'b1' | 'b2' | 'c1';
type LevelExt = Level | 'c2';

interface VocabWord {
  de: string;
  uz: string;
  art: string;
  note: string;
}

interface TestQuestion {
  q: string;
  options: string[];
  correct: number;
}

// ==================== TELEGRAM WEBAPP ====================
const tg = (window as any).Telegram?.WebApp;

// NOTE: sendData() olib tashlandi — chunki u chaqirilganda Telegram Mini App'ni
// darhol yopib qo'yardi. Haqiqiy backend ulanganda, faqat YAKUNIY harakatlar
// uchun (masalan forma yuborish) qaytadan qo'shiladi, navigatsiya uchun emas.

function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') {
  if (!tg?.HapticFeedback) return;
  if (type === 'light' || type === 'medium' || type === 'heavy') {
    tg.HapticFeedback.impactOccurred(type);
  } else {
    tg.HapticFeedback.notificationOccurred(type);
  }
}

// ==================== DEMO DATA ====================
// Level colors lookup


const LEVEL_COLORS: Record<string, string> = {
  a1: '#4ADE80', a2: '#4ADE80', b1: '#FBBF24', b2: '#FBBF24', c1: '#60A5FA', c2: '#F87171'
};

const LUGAT_BOOKS: Record<string, string[]> = {
  a1: ['MOTIVE A1', 'SCHRITTE A1', 'MENSCHEN A1'],
  a2: ['MOTIVE A2', 'SCHRITTE A2', 'MENSCHEN A2'],
  b1: ['MOTIVE B1', 'SCHRITTE B1', 'MENSCHEN B1'],
  b2: ['Sicher B2', 'KompassDaF B2', 'Aspekte B2'],
  c1: ['Sicher C1', 'KompassDaF C1', 'Aspekte C1'],
};

const SAMPLE_WORDS: VocabWord[] = [
  { de: 'Haus', uz: 'uy', art: 'das', note: 'joy, bino' },
  { de: 'Schule', uz: 'maktab', art: 'die', note: "o'quv joyi" },
  { de: 'Buch', uz: 'kitob', art: 'das', note: 'oqish uchun' },
  { de: 'Tisch', uz: 'stol', art: 'der', note: 'mebel' },
  { de: 'Stuhl', uz: 'stul', art: 'der', note: "o'tirish uchun" },
  { de: 'Fenster', uz: 'deraza', art: 'das', note: 'yorugilik uchun' },
  { de: 'Tür', uz: 'eshik', art: 'die', note: 'kirish joyi' },
  { de: 'Wasser', uz: 'suv', art: 'das', note: 'ichimlik' },
  { de: 'Brot', uz: 'non', art: 'das', note: 'oziq-ovqat' },
  { de: 'Freund', uz: "do'st", art: 'der', note: 'inson' },
  { de: 'Stadt', uz: 'shahar', art: 'die', note: 'katta aholi punkti' },
  { de: 'Land', uz: 'mamlakat', art: 'das', note: 'davlat' },
  { de: 'Auto', uz: 'avtomobil', art: 'das', note: 'transport' },
  { de: 'Zeit', uz: 'vaqt', art: 'die', note: 'davom etuvchi narsa' },
  { de: 'Tag', uz: 'kun', art: 'der', note: '24 soat' },
];

const SAMPLE_TOPICS: Record<string, string[]> = {
  a1: ['Salomlashish', 'Oila', 'Taomlar', 'Hayvonlar', 'Ranglar', 'Sonlar', 'Kun tartibi', 'Ob-havo', 'Ta`lim', 'Sayohat', 'Uy', 'Kiyim', 'Vaqtlar', 'Mehnat', 'Sport', 'Sog`liq', 'Texnologiya', 'Tabiat', 'Xarid', 'Transport'],
  a2: ['Oilaviy munosabatlar', 'Oshxona', 'Maktab', 'Dam olish', 'Kasb-hunar', 'Shahar hayoti', 'Qishloq hayoti', 'Bank xizmatlari', 'Pochta', 'Mehmonxona', 'Restoran', 'Teatr', 'Kutubxona', 'Bog`', 'Muzey', 'Aeroport', 'Vokzal', 'Kasalxona', 'Dorixona', 'Zavod'],
  b1: ['Yangi boshlanuvchilar', 'Mehnat bozori', 'Ta`lim tizimi', 'Sog`liqni saqlash', 'Media va yangiliklar', 'San`at va madaniyat', 'Sport turlari', 'Sayohat rejalashtirish', 'Madaniy tadbirlar', 'Texnologik yangiliklar', 'Atrof-muhit', 'Ijtimoiy masalalar', 'Iqtisodiyot', 'Siyosat', 'Fan va kashfiyotlar', 'Oshxona san`ati', 'Moda va uslub', 'Muziqa', 'Kino', 'Adabiyot'],
  b2: ['Xalqaro munosabatlar', 'Global iqtisodiyot', 'Ilm-fan', 'Falsafa', 'Psixologiya', 'Huquq', 'Arxitektura', 'Muhandislik', 'Tibbiyot', 'Biotexnologiya', 'Sun`iy intellekt', 'Kosmik tadqiqotlar', 'Energetika', 'Transport tizimi', 'Urbanistika', 'Antropologiya', 'Sotsiologiya', 'Tarix', 'Lingvistika', 'Pedagogika'],
  c1: ['Diplomatiya', 'Strategik menejment', 'Ilmiy tadqiqotlar', 'Innovatsion texnologiyalar', 'Xalqaro huquq', 'Moliya bozori', 'Kiberxavfsizlik', 'Biologik xilma-xillik', 'Iqlim o`zgarishi', 'Barqaror rivojlanish', 'Raqamli iqtisodiyot', 'Global sog`liqni saqlash', 'Ta`lim siyosati', 'Axborot erkinligi', 'Inson huquqlari', 'Madaniylararo dialog', 'Kelajak kasblari', 'Aqlli shaharlar', 'Virtual reallik', 'Kvant hisoblash'],
};

const SAMPLE_VOCAB_25: VocabWord[] = [
  { de: 'der Tisch', uz: 'stol', art: 'der', note: 'mebel, ovqatlanish uchun' },
  { de: 'die Lampe', uz: 'chiroq', art: 'die', note: 'yoritish qurilmasi' },
  { de: 'das Fenster', uz: 'deraza', art: 'das', note: 'uyning devor qismi' },
  { de: 'der Stuhl', uz: 'stul', art: 'der', note: "o'tirish mebeli" },
  { de: 'die Tasche', uz: 'sumka', art: 'die', note: 'narsalarni tashish uchun' },
  { de: 'das Buch', uz: 'kitob', art: 'das', note: "o'qish materyali" },
  { de: 'der Lehrer', uz: "o'qituvchi", art: 'der', note: 'ta`lim beruvchi' },
  { de: 'die Schule', uz: 'maktab', art: 'die', note: "o'quv muassasasi" },
  { de: 'das Haus', uz: 'uy', art: 'das', note: 'yashash joyi' },
  { de: 'der Garten', uz: "bog'", art: 'der', note: "uy atrofidagi yashil maydon" },
  { de: 'die Blume', uz: 'gul', art: 'die', note: "o'sadigan o'simlik" },
  { de: 'das Wasser', uz: 'suv', art: 'das', note: 'hayot uchun zarur' },
  { de: 'der Hund', uz: 'it', art: 'der', note: 'uy hayvoni' },
  { de: 'die Katze', uz: 'mushuk', art: 'die', note: 'kichik uy hayvoni' },
  { de: 'das Essen', uz: 'taom', art: 'das', note: 'ovqatlanish' },
  { de: 'der Freund', uz: "do'st", art: 'der', note: 'yaqin inson' },
  { de: 'die Stadt', uz: 'shahar', art: 'die', note: 'katta aholi punkti' },
  { de: 'das Land', uz: 'mamlakat', art: 'das', note: 'davlat, hudud' },
  { de: 'der Beruf', uz: 'kasb', art: 'der', note: 'ish, faoliyat' },
  { de: 'die Familie', uz: 'oila', art: 'die', note: 'yaqin qarindoshlar' },
  { de: 'das Kind', uz: 'bola', art: 'das', note: 'kichik yoshdagilar' },
  { de: 'der Mann', uz: 'erkak', art: 'der', note: 'katta yoshdagi erkak' },
  { de: 'die Frau', uz: 'ayol', art: 'die', note: 'katta yoshdagi ayol' },
  { de: 'das Auto', uz: 'mashina', art: 'das', note: 'transport vositasi' },
  { de: 'der Weg', uz: "yo'l", art: 'der', note: "harakatlanish yo'li" },
];

const SAMPLE_TESTS: Record<string, TestQuestion[]> = {
  a1: [
    { q: "Ich ___ ein Student.", options: ['bin', 'bist', 'ist', 'sind'], correct: 0 },
    { q: "Das ist ___ Buch.", options: ['ein', 'eine', 'einen', 'der'], correct: 0 },
    { q: "Woher ___ Sie?", options: ['kommst', 'kommt', 'kommen', 'komme'], correct: 2 },
    { q: "Ich wohne ___ Berlin.", options: ['auf', 'in', 'an', 'bei'], correct: 1 },
    { q: "Er ___ 25 Jahre alt.", options: ['ist', 'bin', 'sind', 'bist'], correct: 0 },
    { q: "___ heißen Sie?", options: ['Wie', 'Was', 'Wo', 'Wer'], correct: 0 },
    { q: "Ich habe zwei ___.", options: ['Bruder', 'Brüder', 'Bruders', 'der Bruder'], correct: 1 },
    { q: "Das ist ___ Schwester.", options: ['mein', 'meine', 'meinen', 'meiner'], correct: 1 },
    { q: "Wir ___ aus Deutschland.", options: ['komme', 'kommt', 'kommen', 'kommst'], correct: 2 },
    { q: "Ich trinke ___ Wasser.", options: ['ein', 'eine', '-', 'der'], correct: 2 },
    { q: "Der Tisch ist ___.", options: ['grün', 'grüne', 'grüner', 'grünes'], correct: 0 },
    { q: "Sie ___ gern Kaffee.", options: ['trinkt', 'trinke', 'trinken', 'trinkst'], correct: 0 },
    { q: "___ Uhr ist es?", options: ['Wie viel', 'Wie viele', 'Was', 'Welche'], correct: 0 },
    { q: "Ich gehe ___ Supermarkt.", options: ['zum', 'zur', 'zu der', 'zu die'], correct: 0 },
    { q: "Das ist das ___ Auto.", options: ['schnell', 'schnelle', 'schnellen', 'schneller'], correct: 1 },
  ],
  a2: [
    { q: "Gestern ___ ich ins Kino gegangen.", options: ['bin', 'war', 'habe', 'ist'], correct: 0 },
    { q: "Ich habe ___ Buch gelesen.", options: ['ein interessantes', 'eine interessante', 'ein interessant', 'einen interessanten'], correct: 0 },
    { q: "Wenn ich Zeit ___, würde ich kommen.", options: ['habe', 'hätte', 'hatte', 'haben'], correct: 1 },
    { q: "Er ___ seit 5 Jahren Deutsch.", options: ['lernt', 'lernte', 'hat gelernt', 'hat gelernt'], correct: 0 },
    { q: "Das ist der Mann, ___ ich gestern gesehen habe.", options: ['der', 'den', 'dem', 'dessen'], correct: 1 },
    { q: "Ich ___ gerne mehr über Deutschland wissen.", options: ['würde', 'würdest', 'würden', 'würden'], correct: 0 },
    { q: "Die Kinder ___ im Garten spielen.", options: ['können', 'kann', 'könnst', 'könnt'], correct: 0 },
    { q: "___ du schon Deutschland besucht?", options: ['Hast', 'Bist', 'Hast du', 'Warst'], correct: 0 },
    { q: "Ich interessiere mich ___ Musik.", options: ['für', 'an', 'auf', 'in'], correct: 0 },
    { q: "Das Haus ist ___ als das andere.", options: ['größer', 'am größten', 'groß', 'große'], correct: 0 },
    { q: "Er hat mir ___ Buch geliehen.", options: ['sein', 'seinen', 'seiner', 'seines'], correct: 0 },
    { q: "Ich freue mich ___ das Wochenende.", options: ['auf', 'für', 'an', 'in'], correct: 0 },
    { q: "Wir ___ uns seit der Kindheit.", options: ['kennen', 'wissen', 'können', 'kennt'], correct: 0 },
    { q: "Der Film war sehr ___.", options: ['interessant', 'interessante', 'interessanter', 'interessantes'], correct: 0 },
    { q: "Ich ___ nach Hause gehen.", options: ['muss', 'müsse', 'musst', 'müssen'], correct: 0 },
  ],
  b1: [
    { q: "Er ___ das Projekt bis nächste Woche fertig haben.", options: ['wird', 'würde', 'wird ... haben', 'hatte'], correct: 2 },
    { q: "Ich ___ lieber zu Hause geblieben.", options: ['wäre', 'würde', 'war', 'bin'], correct: 0 },
    { q: "___ man mehr Sport treiben würde, wäre man gesünder.", options: ['Wenn', 'Als', 'Obwohl', 'Weil'], correct: 0 },
    { q: "Das ist das Buch, ___ ich dir empfohlen habe.", options: ['das', 'dass', 'was', 'welches'], correct: 0 },
    { q: "Trotz ___ Regens sind wir spazieren gegangen.", options: ['des', 'der', 'dem', 'den'], correct: 0 },
    { q: "Ich habe ___ vergessen, ihn anzurufen.", options: ['es', 'das', 'ihn', 'mich'], correct: 0 },
    { q: "___ du mir helfen, das zu tragen?", options: ['Könntest', 'Kannst', 'Dürftest', 'Solltest'], correct: 0 },
    { q: "Die Prüfung war viel ___ als erwartet.", options: ['schwieriger', 'schwierigste', 'am schwierigsten', 'schwierig'], correct: 0 },
    { q: "Ich bin der ___, dass das klappt.", options: ['Meinung', 'Ansicht', 'Überzeugung', 'Auffassung'], correct: 0 },
    { q: "Er ___ sich um die Kinder gekümmert.", options: ['hat', 'ist', 'hatte', 'wurde'], correct: 0 },
    { q: "___ ich das gewusst hätte, wäre ich nicht gekommen.", options: ['Hätte', 'Wenn', 'Obwohl', 'Weil'], correct: 0 },
    { q: "Das ist einer ___ interessantesten Bücher.", options: ['der', 'die', 'den', 'des'], correct: 0 },
    { q: "Ich lade dich ___ Essen ein.", options: ['zum', 'zur', 'zum', 'ins'], correct: 0 },
    { q: "Er ___ sich schon seit Jahren mit diesem Thema beschäftigt.", options: ['hat', 'ist', 'hatte', 'wird'], correct: 0 },
    { q: "___ der Tatsache, dass es regnete, hatten wir Spaß.", options: ['Trotz', 'Wegen', 'Obwohl', 'Während'], correct: 0 },
  ],
  b2: [
    { q: "Es ist unwahrscheinlich, dass er ___ kommt.", options: ['noch', 'schon', 'bereits', 'jetzt'], correct: 0 },
    { q: "Ich bin davon ___, dass das stimmt.", options: ['überzeugt', 'überzeugend', 'überzeugung', 'überzeugte'], correct: 0 },
    { q: "___ er auch arm ist, ist er glücklich.", options: ['Obwohl', 'Trotz', 'Wegen', 'Während'], correct: 0 },
    { q: "Das ___ zu einem ernsten Problem werden.", options: ['könnte', 'kann', 'könnt', 'könntest'], correct: 0 },
    { q: "Ich hätte das nicht ___ sollen.", options: ['getan', 'tun', 'tat', 'tuend'], correct: 0 },
    { q: "Er hat ___ Interesse an der Sache gezeigt.", options: ['kein', 'nicht', 'keinen', 'keine'], correct: 0 },
    { q: "Die ___ Zahl der Arbeitslosen ist besorgniserregend.", options: ['steigende', 'steigen', 'steigt', 'gestiegen'], correct: 0 },
    { q: "Ich bin ___ der Situation überfordert.", options: ['mit', 'von', 'in', 'bei'], correct: 0 },
    { q: "Es ___ sich um einen Missverständnis handeln.", options: ['könnte', 'kann', 'muss', 'darf'], correct: 0 },
    { q: "___ man die Ursachen versteht, kann man Lösungen finden.", options: ['Wenn', 'Sobald', 'Obwohl', 'Während'], correct: 1 },
    { q: "Die Regierung ___ neue Maßnahmen ergriffen.", options: ['hat', 'ist', 'hatte', 'wurde'], correct: 0 },
    { q: "Ich bin ___ Standpunkt, dass...", options: ['der', 'die', 'dem', 'den'], correct: 0 },
    { q: "Das Projekt wurde ___ finanziellen Gründen abgebrochen.", options: ['aus', 'wegen', 'trotz', 'mit'], correct: 0 },
    { q: "Er ___ sich darauf konzentriert, seine Ziele zu erreichen.", options: ['hat', 'ist', 'hatte', 'wurde'], correct: 0 },
    { q: "Ich bin der ___, dass eine Veränderung notwendig ist.", options: ['Auffassung', 'Ansicht', 'Meinung', 'Überzeugung'], correct: 0 },
  ],
  c1: [
    { q: "Man ___ davon ausgehen, dass die Lage sich verbessern wird.", options: ['kann', 'muss', 'darf', 'soll'], correct: 0 },
    { q: "Es steht außer ___, dass er das getan hat.", options: ['Frage', 'Zweifel', 'Diskussion', 'Kontrolle'], correct: 1 },
    { q: "Die ___ der Daten ist von höchster Wichtigkeit.", options: ['Integrität', 'Integration', 'Integrierung', 'Integritätsschutz'], correct: 0 },
    { q: "Ich bin nicht ___ der Lage, das zu beurteilen.", options: ['in', 'an', 'bei', 'auf'], correct: 0 },
    { q: "Es ___ sich, dass die ursprüngliche Annahme falsch war.", options: ['stellt heraus', 'stellt raus', 'stellt sich heraus', 'findet'], correct: 2 },
    { q: "Die Studie ___ eindeutige Ergebnisse zutage.", options: ['bringt', 'fördert', 'fördert ... zutage', 'legt'], correct: 2 },
    { q: "Er ___ es ab, eine Stellungnahme abzugeben.", options: ['lehnte', 'lehnt', 'hat abgelehnt', 'lehnte ... ab'], correct: 3 },
    { q: "Das liegt ___ der Tatsache, dass...", options: ['an', 'bei', 'in', 'auf'], correct: 0 },
    { q: "Es ist ___ fraglich, ob das funktionieren wird.", options: ['durchaus', 'vielleicht', 'möglicherweise', 'wahrscheinlich'], correct: 0 },
    { q: "Die ___ dieser Entscheidung sind weitreichend.", options: ['Konsequenzen', 'Folgen', 'Auswirkungen', 'alle'], correct: 3 },
    { q: "Man ___ in Betracht ziehen, dass...", options: ['muss', 'sollte', 'darf', 'kann'], correct: 1 },
    { q: "Er ___ sich damit auseinandergesetzt.", options: ['hat', 'ist', 'hatte', 'wurde'], correct: 0 },
    { q: "Das ___ zur Debatte steht.", options: ['ist', 'steht', 'kommt', 'bleibt'], correct: 1 },
    { q: "Ich bin ___ der Auffassung, dass...", options: ['von', 'auf', 'in', 'an'], correct: 0 },
    { q: "Es ___ Anlass zur Sorge.", options: ['besteht', 'gibt', 'ist', 'findet'], correct: 0 },
  ],
};

const SAYFA_FILES: Record<string, { name: string; type: string; size: string }[]> = {
  b1: [
    { name: 'Sayfa B1 - Lektion 1-5', type: 'pdf', size: '2.4 MB' },
    { name: 'Sayfa B1 - Lektion 6-10', type: 'pdf', size: '3.1 MB' },
    { name: 'Sayfa B1 - Audio 1', type: 'audio', size: '15.2 MB' },
    { name: 'Sayfa B1 - Audio 2', type: 'audio', size: '18.7 MB' },
    { name: 'Sayfa B1 - Mavzular', type: 'pdf', size: '1.8 MB' },
  ],
  telc: [
    { name: 'Telc B1 - Modelltest 1', type: 'pdf', size: '4.2 MB' },
    { name: 'Telc B1 - Modelltest 2', type: 'pdf', size: '4.5 MB' },
    { name: 'Telc B1 - Audio Test 1', type: 'audio', size: '22.1 MB' },
    { name: 'Telc B1 - Audio Test 2', type: 'audio', size: '24.3 MB' },
    { name: 'Telc B1 - So`zlash qoidalari', type: 'pdf', size: '1.2 MB' },
  ],
};

const KITOB_FILES: Record<string, { name: string; desc: string; files: { name: string; type: string; size: string }[] }[]> = {
  a1: [
    { name: 'MOTIVE A1', desc: 'Boshlang`ich daraja, 18 ta mavzu', files: [{ name: 'Darslik PDF', type: 'pdf', size: '12 MB' }, { name: 'Audio 1-9', type: 'audio', size: '45 MB' }, { name: 'Audio 10-18', type: 'audio', size: '48 MB' }] },
    { name: 'SCHRITTE A1', desc: 'Qadamma-qadam, 14 ta birlik', files: [{ name: 'Darslik PDF', type: 'pdf', size: '15 MB' }, { name: 'Audio to`plami', type: 'audio', size: '62 MB' }] },
    { name: 'MENSCHEN A1', desc: 'Muloqotga yo`naltirilgan', files: [{ name: 'Darslik PDF', type: 'pdf', size: '18 MB' }, { name: 'Audio to`plami', type: 'audio', size: '55 MB' }, { name: 'Video darslar', type: 'video', size: '120 MB' }] },
  ],
  a2: [
    { name: 'MOTIVE A2', desc: 'Elementar daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '14 MB' }, { name: 'Audio to`plami', type: 'audio', size: '52 MB' }] },
    { name: 'SCHRITTE A2', desc: 'Davomi, 14 ta birlik', files: [{ name: 'Darslik PDF', type: 'pdf', size: '16 MB' }, { name: 'Audio to`plami', type: 'audio', size: '58 MB' }] },
    { name: 'MENSCHEN A2', desc: 'Muloqotni rivojlantirish', files: [{ name: 'Darslik PDF', type: 'pdf', size: '19 MB' }, { name: 'Audio to`plami', type: 'audio', size: '60 MB' }, { name: 'Video darslar', type: 'video', size: '135 MB' }] },
  ],
  b1: [
    { name: 'MOTIVE B1', desc: 'O`rta daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '16 MB' }, { name: 'Audio to`plami', type: 'audio', size: '55 MB' }] },
    { name: 'SCHRITTE B1', desc: 'O`rta daraja, 14 ta birlik', files: [{ name: 'Darslik PDF', type: 'pdf', size: '18 MB' }, { name: 'Audio to`plami', type: 'audio', size: '65 MB' }] },
    { name: 'MENSCHEN B1', desc: 'Mustaqil muloqot', files: [{ name: 'Darslik PDF', type: 'pdf', size: '20 MB' }, { name: 'Audio to`plami', type: 'audio', size: '70 MB' }, { name: 'Video darslar', type: 'video', size: '150 MB' }] },
  ],
  b2: [
    { name: 'Sicher B2', desc: 'Yuqori o`rta daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '18 MB' }, { name: 'Audio to`plami', type: 'audio', size: '60 MB' }] },
    { name: 'KompassDaF B2', desc: 'Kasbiy yo`naltirish', files: [{ name: 'Darslik PDF', type: 'pdf', size: '15 MB' }, { name: 'Audio to`plami', type: 'audio', size: '50 MB' }] },
    { name: 'Aspekte B2', desc: 'Ilmiy va akademik', files: [{ name: 'Darslik PDF', type: 'pdf', size: '22 MB' }, { name: 'Audio to`plami', type: 'audio', size: '75 MB' }] },
  ],
  c1: [
    { name: 'Sicher C1', desc: 'Yuqori daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '20 MB' }, { name: 'Audio to`plami', type: 'audio', size: '65 MB' }] },
    { name: 'KompassDaF C1', desc: 'Professional daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '18 MB' }, { name: 'Audio to`plami', type: 'audio', size: '55 MB' }] },
    { name: 'Aspekte C1', desc: 'Akademik mukammallik', files: [{ name: 'Darslik PDF', type: 'pdf', size: '25 MB' }, { name: 'Audio to`plami', type: 'audio', size: '80 MB' }] },
  ],
  c2: [
    { name: 'C2 Meisterwerk', desc: 'Mukammal daraja', files: [{ name: 'Darslik PDF', type: 'pdf', size: '22 MB' }, { name: 'Audio to`plami', type: 'audio', size: '70 MB' }] },
    { name: 'C2 Akademik', desc: 'Universitet darajasi', files: [{ name: 'Darslik PDF', type: 'pdf', size: '28 MB' }, { name: 'Audio to`plami', type: 'audio', size: '85 MB' }] },
  ],
};

const DAILY_WORDS = [
  { de: 'das Wunder', uz: 'mo`jiza', art: 'das', example: 'Es ist ein Wunder, dass er gesund ist.', note: 'Kutilmagan, ajablanarli narsa' },
  { de: 'die Geduld', uz: 'sabr', art: 'die', example: 'Geduld ist eine Tugend.', note: 'Qo`pol vaziyatda tinch turish' },
  { de: 'der Erfolg', uz: 'muvaffaqiyat', art: 'der', example: 'Erfolg kommt durch harte Arbeit.', note: 'Maqsadga yetish, yutuq' },
  { de: 'die Hoffnung', uz: 'umid', art: 'die', example: 'Die Hoffnung stirbt zuletzt.', note: 'Kelajakdan yaxshi kutish' },
  { de: 'die Freiheit', uz: 'erkinlik', art: 'die', example: 'Freiheit ist das höchste Gut.', note: 'Cheklovsizlik' },
  { de: 'das Abenteuer', uz: 'sarguzasht', art: 'das', example: 'Das Reisen ist ein großes Abenteuer.', note: 'Hayajonli tajriba' },
  { de: 'der Mut', uz: 'jasorat', art: 'der', example: 'Mut ist die Überwindung der Angst.', note: 'Qo`rqmaslik, jasorat' },
];

const VORSTELLUNG_QUESTIONS = [
  '1. Stellen Sie sich vor! Wie heißen Sie und wie alt sind Sie? (O`zingizni taqdim eting! Ismingiz va yoshingizni ayting)',
  '2. Woher kommen Sie? Erzählen Sie von Ihrem Heimatland. (Qayerdansiz? Vataningiz haqida gapiring.)',
  '3. Wo wohnen Sie? Beschreiben Sie Ihre Wohnung/Ihr Haus. (Qayerda yashaysiz? Uyingizni tavsiflang.)',
  '4. Erzählen Sie von Ihrer Familie. (Oilaingiz haqida gapiring.)',
  '5. Wo haben Sie Deutsch gelernt? Wie lange lernen Sie schon? (Qayerda nemis tilini o`rgandingiz? Qancha vaqtdan beri o`rganasiz?)',
  '6. Was machen Sie? (Studium, Beruf, Schule...) (Nima ish qilasiz? (O`qish, ish, maktab...))',
  '7. Welche Sprachen sprechen Sie? Warum lernen Sie Deutsch? (Qaysi tillarni bilasiz? Nima uchun nemis tilini o`rganasiz?)',
];

// ==================== SIMPLE FLUID BACKGROUND (CSS-based for reliability) ====================
function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 20 + Math.random() * 80,
        alpha: 0.03 + Math.random() * 0.06,
      });
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!ctx || !canvas) return;
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep blue gradient base
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.4, 0,
        canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.8
      );
      grad.addColorStop(0, '#0f2847');
      grad.addColorStop(0.5, '#0B1D3A');
      grad.addColorStop(1, '#060f1f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated flowing orbs
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10 || p.x > 110) p.vx *= -1;
        if (p.y < -10 || p.y > 110) p.vy *= -1;

        const px = (p.x / 100) * canvas.width;
        const py = (p.y / 100) * canvas.height;
        const pr = (p.r / 100) * canvas.width;

        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `rgba(74, 159, 231, ${p.alpha})`);
        g.addColorStop(0.5, `rgba(26, 58, 92, ${p.alpha * 0.5})`);
        g.addColorStop(1, 'rgba(11, 29, 58, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle wave lines
      ctx.strokeStyle = 'rgba(143, 211, 244, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height * 0.3 + i * 60 + Math.sin(x * 0.005 + time + i) * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Crystallization frost effect (subtle)
      const frostAlpha = 0.02 + Math.sin(time * 0.5) * 0.01;
      const frost = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(time * 0.3) * 0.3),
        canvas.height * (0.5 + Math.cos(time * 0.4) * 0.3),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.6
      );
      frost.addColorStop(0, `rgba(143, 211, 244, ${frostAlpha})`);
      frost.addColorStop(1, 'rgba(143, 211, 244, 0)');
      ctx.fillStyle = frost;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ==================== SHARED COMPONENTS ====================
function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(11,29,58,0.9) 0%, rgba(11,29,58,0.6) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <button
        onClick={() => { haptic('light'); onBack(); }}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--surface-glass)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        <ChevronLeft size={20} />
      </button>
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const color = LEVEL_COLORS[level] || '#4A9FE7';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        borderRadius: 12,
        background: `${color}25`,
        color,
        fontSize: 12,
        fontWeight: 700,
        fontStyle: 'italic',
        border: `1px solid ${color}40`,
      }}
    >
      {level.toUpperCase()}
    </span>
  );
}

// ==================== MAIN MENU SCREEN ====================
function MainMenu({ onNavigate }: { onNavigate: (v: View, payload?: any) => void }) {
  const menuItems = [
    { icon: Brain, label: 'AI Mentor', view: 'ai_mentor' as View },
    { icon: BookOpenText, label: "Lug'at", view: 'lugat' as View },
    { icon: Globe, label: 'Tarjimon', view: 'tarjimon' as View },
    { icon: BookOpen, label: 'Sayfa', view: 'sayfa' as View },
    { icon: FolderOpen, label: 'Kitob', view: 'kitob' as View },
    { icon: Calendar, label: "Kunlik so'z", view: 'kunlik_soz' as View },
    { icon: BarChart3, label: 'Progressim', view: 'progressim' as View },
    { icon: Settings, label: 'Sozlamalar', view: 'sozlamalar' as View },
  ];

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(180deg, rgba(11,29,58,0.85) 0%, rgba(11,29,58,0.4) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1E5F9E, #4A9FE7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontStyle: 'italic', color: 'white', lineHeight: 1.2 }}>
              Sprechen mit Spass
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
              DEUTSCH LERNEN
            </div>
          </div>
        </div>
        <button
          onClick={() => { haptic('light'); onNavigate('sozlamalar'); }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Welcome Banner */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div className="glass-card shimmer" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', color: 'white' }}>
            Salom! 🇩🇪 Nemis tilini biz bilan o'rganing
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Kunning bir so'zi, bir lug'at, bir qadam...
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{ flex: 1, padding: '0 16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {menuItems.map((item) => (
            <div key={item.view} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                className="menu-circle-btn"
                onClick={() => {
                  haptic('light');
                  onNavigate(item.view);
                }}
                style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
              >
                <item.icon size={24} strokeWidth={1.5} />
                <span className="label">{item.label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Test Button - Centered */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button
              className="menu-circle-btn"
              onClick={() => {
                haptic('light');
                onNavigate('test');
              }}
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                boxShadow: '0 4px 24px rgba(245, 158, 11, 0.35)',
              }}
            >
              <ClipboardList size={28} strokeWidth={1.5} />
              <span className="label" style={{ fontSize: 10 }}>Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 0',
          background: 'rgba(11,29,58,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {[
          { icon: Home, label: 'Asosiy' },
          { icon: Search, label: 'Qidiruv' },
          { icon: Bookmark, label: 'Saqlangan' },
          { icon: User, label: 'Profil' },
        ].map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => haptic('light')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: i === 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
              padding: '4px 12px',
            }}
          >
            <tab.icon size={20} strokeWidth={i === 0 ? 2.5 : 1.5} />
            <span style={{ fontSize: 9, fontWeight: 500 }}>{tab.label}</span>
            {i === 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== AI MENTOR SCREEN ====================
function AIMentorScreen({ onNavigate, onBack }: { onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="AI Mentor" onBack={onBack} />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Vorstellung Card */}
        <button
          className="glass-card glass-card-hover"
          onClick={() => { haptic('light'); onNavigate('vorstellung'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, textAlign: 'left', width: '100%' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic size={28} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: 'white' }}>Vorstellung</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              O'zingizni taqdim eting — 7 ta savolga javob bering, AI tahlil qiladi
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </button>

        {/* Aktiv Sprechen Card */}
        <button
          className="glass-card glass-card-hover"
          onClick={() => { haptic('light'); onNavigate('aktiv_sprechen'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, textAlign: 'left', width: '100%' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10B981, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Volume2 size={28} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: 'white' }}>Aktiv Sprechen</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Ovozli lug'at — 25 ta so'z, hikoya va prezentatsiya
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </button>

        {/* Info Card */}
        <div className="glass-card" style={{ padding: 16, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic', color: 'var(--accent-amber)' }}>AI imkoniyatlari</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            • Vorstellung: O'zingizni 7 ta nuqtada taqdim eting, AI sizning gapirish darajangizni tahlil qiladi va PDF hisobot beradi.
            <br />
            • Aktiv Sprechen: Har mavzuda 25 ta so'z yodlang, keyin AI hikoya yaratib, prezentatsiya tayyorlaydi.
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== VORSTELLUNG SCREEN ====================
function VorstellungScreen({ onBack }: { onBack: () => void }) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Vorstellung" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Vorstellen Card Image */}
        <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 16, padding: 0 }}>
          <img
            src="/vorstellen_card.jpg"
            alt="Vorstellung savollari"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Instructions */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic', color: 'var(--accent-blue)', marginBottom: 8 }}>
            <Flag size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Tayyorlanish yo'riqnomasi
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Iltimos, <strong style={{ color: 'var(--accent-amber)' }}>10 daqiqa</strong> tayyorlaning. Quyidagi 7 ta savolga to'liq javob bering.
            Javoblaringizni audio yoki matn shaklida yuborishingiz mumkin. AI sizning gapirish darajangizni tahlil qilib, PDF hisobot tayyorlaydi.
          </div>
        </div>

        {/* Questions */}
        <div style={{ marginBottom: 16 }}>
          {VORSTELLUNG_QUESTIONS.map((q, i) => (
            <div key={i} className="glass-card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <button
            className="gradient-btn"
            onClick={() => {
              haptic('medium');
              alert('Audio yuborish uchun Telegram ovozli xabar yuborish tugmasidan foydalaning. Bot avtomatik qabul qiladi.');
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Mic size={18} /> Audio yuborish
            </span>
          </button>
          <button
            className="glass-btn"
            onClick={() => { haptic('light'); setShowTextInput(!showTextInput); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FileText size={18} /> Matn yuborish
            </span>
          </button>
        </div>

        {/* Text Input */}
        {showTextInput && (
          <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Javoblaringizni shu yerga yozing..."
              style={{
                width: '100%',
                minHeight: 120,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 12,
                color: 'white',
                fontSize: 13,
                fontFamily: "'Montserrat', sans-serif",
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <button
              className="gradient-btn"
              style={{ marginTop: 12 }}
              onClick={() => {
                if (!textAnswer.trim()) return;
                haptic('success');
                alert('Javobingiz yuborildi! AI tahlil qilib, PDF hisobot tayyorlaydi.');
                setTextAnswer('');
                setShowTextInput(false);
              }}
            >
              Yuborish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== AKTIV SPRECHEN SCREEN ====================
// ==================== AKTIV SPRECHEN — vocabulary.json based ====================

// Types
interface VocabEntry {
  german: string;
  article: string | null;
  uzbek: string;
}

interface VocabDB {
  [level: string]: {
    [book: string]: {
      [chapter: string]: VocabEntry[];
    };
  };
}

const BOOK_EMOJI: Record<string, string> = {
  Motivie: '📕', Schritte: '📗', Menschen: '📘',
  Sicher: '📙', Aspekte: '📓', Kompassdaf: '📔',
};

const ART_COLOR: Record<string, string> = {
  der: '#4A9FE7', die: '#F87171', das: '#4ADE80',
};

function useVocabDB() {
  const [db, setDb] = useState<VocabDB | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/vocabulary.json')
      .then((r) => r.json())
      .then((data) => { setDb(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { db, loading };
}

function AktivSprechenScreen({ onNavigate, onBack }: { onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  const { db, loading } = useVocabDB();
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const levels = ['A1', 'A2', 'B1', 'B2'];

  const books = db ? Object.keys(db[selectedLevel] || {}) : [];

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Aktiv Sprechen" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* Info */}
        <div className="glass-card" style={{ padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <Volume2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent-green)' }} />
            Darajani tanlang → Kitobni oching → Lektsiya so'zlarini o'rganing!
          </div>
        </div>

        {/* Level Selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => { haptic('light'); setSelectedLevel(lvl); }}
              style={{
                padding: '8px 22px', borderRadius: 20, border: '1px solid',
                borderColor: selectedLevel === lvl ? LEVEL_COLORS[lvl.toLowerCase()] : 'var(--border-subtle)',
                background: selectedLevel === lvl ? `${LEVEL_COLORS[lvl.toLowerCase()]}25` : 'var(--surface-glass)',
                color: selectedLevel === lvl ? LEVEL_COLORS[lvl.toLowerCase()] : 'var(--text-secondary)',
                fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Books */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Yuklanmoqda...</div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Ma'lumot topilmadi</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {books.map((book) => {
              const chapters = db ? Object.keys(db[selectedLevel]?.[book] || {}) : [];
              const totalWords = db ? chapters.reduce((acc, ch) => acc + (db[selectedLevel]?.[book]?.[ch]?.length || 0), 0) : 0;
              const emoji = BOOK_EMOJI[book] || '📚';
              return (
                <button
                  key={book}
                  className="glass-card glass-card-hover"
                  onClick={() => { haptic('light'); onNavigate('aktiv_words', { level: selectedLevel, book }); }}
                  style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg, #10B981, #34D399)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                  }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>{book}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {chapters.length} ta lektion • {totalWords} ta so'z
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </button>
              );
            })}
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ==================== AKTIV WORDS SCREEN (Lektion tanlash + So'zlar) ====================
function AktivWordsScreen({ payload, onNavigate, onBack }: { payload: any; onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  const { db, loading } = useVocabDB();
  const { level, book, chapter } = payload || {};
  const [selectedChapter, setSelectedChapter] = useState<string | null>(chapter || null);

  const chapters = db ? Object.keys(db[level]?.[book] || {}) : [];
  const words: VocabEntry[] = (selectedChapter && db) ? (db[level]?.[book]?.[selectedChapter] || []) : [];
  const emoji = BOOK_EMOJI[book] || '📚';

  if (loading) {
    return (
      <div className="view-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title={`${emoji} ${book} — ${level}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {!selectedChapter ? (
          <>
            {/* Lektion tanlash */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Lektsiyani tanlang ({chapters.length} ta):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {chapters.map((ch) => {
                const wc = db?.[level]?.[book]?.[ch]?.length || 0;
                return (
                  <button
                    key={ch}
                    className="glass-card glass-card-hover"
                    onClick={() => { haptic('light'); setSelectedChapter(ch); }}
                    style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>{ch.replace('Lektion ', 'L')}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wc} so'z</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* So'zlar ro'yxati */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setSelectedChapter(null)}
                style={{ background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '4px 10px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >
                ← Lektsiyalar
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{selectedChapter}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{words.length} ta so'z</span>
            </div>

            {words.map((word, i) => {
              const art = word.article || '';
              const artColor = ART_COLOR[art] || 'var(--text-muted)';
              return (
                <div key={i} className="glass-card" style={{ padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-glass)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {art && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                          background: `${artColor}25`, color: artColor,
                        }}>{art}</span>
                      )}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{word.german}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{word.uzbek}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>
    </div>
  );
}

// ==================== AKTIV STORY SCREEN ====================
function AktivStoryScreen({ payload, onBack }: { payload: any; onBack: () => void }) {
  const { level, topicName } = payload || {};
  const story = `Eines Tages beschloss ich, eine Reise durch die Stadt zu machen. Ich ging zu Fuß und sah viele schöne Häuser, blühende Blumen in jedem Garten, und freundliche Menschen auf der Straße. Ich traf meinen alten Freund, der gerade aus der Schule kam. Wir gingen zusammen in ein kleines Café und bestellten Wasser und Brot.`;

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Hikoya" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <LevelBadge level={(level || 'a1').toLowerCase()} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{topicName || 'Mavzu'}</span>
        </div>
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>{story}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== LUG'AT SCREEN ====================
function LugatScreen({ onNavigate, onBack }: { onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  const [selectedLevel, setSelectedLevel] = useState<Level>('a1');
  const levels: Level[] = ['a1', 'a2', 'b1', 'b2', 'c1'];
  const books = LUGAT_BOOKS[selectedLevel] || [];

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Lug'at" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Level Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => { haptic('light'); setSelectedLevel(lvl); }}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: selectedLevel === lvl ? LEVEL_COLORS[lvl] : 'var(--border-subtle)',
                background: selectedLevel === lvl ? `${LEVEL_COLORS[lvl]}25` : 'var(--surface-glass)',
                color: selectedLevel === lvl ? LEVEL_COLORS[lvl] : 'var(--text-secondary)',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Books */}
        {books.map((book, i) => (
          <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[selectedLevel]}40, ${LEVEL_COLORS[selectedLevel]}20)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={20} color={LEVEL_COLORS[selectedLevel]} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{book}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lektion 1-20</div>
              </div>
            </div>

            {/* Chapters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Array.from({ length: 8 }, (_, j) => (
                <button
                  key={j}
                  className="glass-card glass-card-hover"
                  onClick={() => {
                    haptic('light');
                    onNavigate('lugat_words', { level: selectedLevel, book, chapter: j + 1 });
                  }}
                  style={{
                    padding: '10px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>L{j + 1}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== LUG'AT WORDS SCREEN ====================
function LugatWordsScreen({ payload, onBack }: { payload: any; onBack: () => void }) {
  const { level, book, chapter } = payload || {};
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return SAMPLE_WORDS;
    return SAMPLE_WORDS.filter(w =>
      w.de.toLowerCase().includes(search.toLowerCase()) ||
      w.uz.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title={`${book || 'Kitob'} — L${chapter || 1}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <LevelBadge level={level || 'a1'} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>So'zlar ro'yxati (namuna)</span>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="So'z qidirish..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'white',
            fontSize: 13,
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: 12,
            outline: 'none',
          }}
        />

        {filtered.map((word, i) => (
          <button
            key={i}
            className="glass-card glass-card-hover"
            onClick={() => { haptic('light'); setExpandedIndex(expandedIndex === i ? null : i); }}
            style={{
              padding: 12,
              marginBottom: 8,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 32, height: 20, borderRadius: 6,
                background: word.art === 'der' ? 'rgba(74,159,231,0.2)' : word.art === 'die' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)',
                color: word.art === 'der' ? '#4A9FE7' : word.art === 'die' ? '#F87171' : '#4ADE80',
                fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {word.art}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{word.de}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{word.uz}</div>
              </div>
              <Volume2 size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
            {expandedIndex === i && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Izoh:</strong> {word.note}
                <br />
                <em style={{ color: 'var(--accent-blue)' }}>Misol: "Ich habe ein {word.de} in meinem Zimmer."</em>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== TARJIMON SCREEN ====================
function TarjimonScreen({ onBack }: { onBack: () => void }) {
  const [direction, setDirection] = useState<'uz_de' | 'de_uz'>('uz_de');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ translation: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    haptic('medium');
    setLoading(true);

    try {
      const systemPrompt = direction === 'uz_de'
        ? `Nemis tili tarjimoni. O'zbekchadan nemischaga tarjima qil. Faqat JSON: {"translation": "nemischa", "explanation": "grammatik izoh o'zbek tilida"}`
        : `Nemis tili tarjimoni. Nemischadan o'zbekchaga tarjima qil. Faqat JSON: {"translation": "o'zbekcha", "explanation": "grammatik izoh o'zbek tilida"}`;

      const groqKey = (window as any).__GROQ_KEY__ || import.meta.env.VITE_GROQ_KEY || '';
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: input.trim() }],
          max_tokens: 512,
          temperature: 0.3,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content || '';
        try {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          setResult({ translation: parsed.translation || text, explanation: parsed.explanation || '' });
          haptic('success');
        } catch { setResult({ translation: text, explanation: '' }); haptic('success'); }
      } else {
        setResult({ translation: 'Tarjima qilinmadi (API xato)', explanation: 'Bot orqali ishlating.' });
      }
    } catch {
      setResult({ translation: 'Internet muammosi', explanation: '' });
    }
    setLoading(false);
  };

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Tarjimon" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Direction Toggle */}
        <div className="glass-card" style={{ padding: 4, display: 'flex', marginBottom: 16 }}>
          <button
            onClick={() => { haptic('light'); setDirection('uz_de'); setResult(null); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: direction === 'uz_de' ? 'linear-gradient(135deg, #1E5F9E, #4A9FE7)' : 'transparent',
              color: direction === 'uz_de' ? 'white' : 'var(--text-muted)',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🇺🇿 UZ → 🇩🇪 DE
          </button>
          <button
            onClick={() => { haptic('light'); setDirection('de_uz'); setResult(null); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: direction === 'de_uz' ? 'linear-gradient(135deg, #1E5F9E, #4A9FE7)' : 'transparent',
              color: direction === 'de_uz' ? 'white' : 'var(--text-muted)',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🇩🇪 DE → 🇺🇿 UZ
          </button>
        </div>

        {/* Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={direction === 'uz_de' ? "O'zbekcha matn kiriting..." : 'Deutschen Text eingeben...'}
          style={{
            width: '100%',
            minHeight: 100,
            padding: 14,
            borderRadius: 12,
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'white',
            fontSize: 14,
            fontFamily: "'Montserrat', sans-serif",
            resize: 'vertical',
            outline: 'none',
            marginBottom: 12,
          }}
        />

        <button
          className="gradient-btn"
          onClick={handleTranslate}
          disabled={loading || !input.trim()}
          style={{ opacity: loading || !input.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Tarjima qilinmoqda...' : 'Tarjima qilish'}
        </button>

        {/* Result */}
        {result && (
          <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Asl matn:</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>{input}</div>

            <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginBottom: 4 }}>Tarjima:</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 12 }}>{result.translation}</div>

            <div style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 4 }}>Grammatik izoh:</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.explanation}</div>

            <button
              onClick={() => {
                haptic('light');
              }}
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '6px 14px',
                color: 'var(--accent-blue)',
                fontSize: 12,
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Volume2 size={14} /> Ovozda eshitish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SAYFA SCREEN ====================
function SayfaScreen({ onNavigate, onBack }: { onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Sayfa" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Sayfa B1 */}
        <button
          className="glass-card glass-card-hover"
          onClick={() => { haptic('light'); onNavigate('sayfa_files', { type: 'b1' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, marginBottom: 12, width: '100%', textAlign: 'left' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: 'white' }}>Sayfa B1</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Asosiy darslik materiallari, audio va PDF fayllar
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Telc Materiallar */}
        <button
          className="glass-card glass-card-hover"
          onClick={() => { haptic('light'); onNavigate('sayfa_files', { type: 'telc' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, marginBottom: 12, width: '100%', textAlign: 'left' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: 'white' }}>Telc Materiallar</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Telc imtihoniga tayyorgarlik materiallari va testlar
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );
}

// ==================== SAYFA FILES SCREEN ====================
function SayfaFilesScreen({ payload, onBack }: { payload: any; onBack: () => void }) {
  const { type } = payload || {};
  const files = SAYFA_FILES[type as string] || [];
  const title = type === 'b1' ? 'Sayfa B1' : 'Telc Materiallar';

  const fileIcon = (t: string) => {
    if (t === 'pdf') return <FileText size={20} color="#F87171" />;
    if (t === 'audio') return <Headphones size={20} color="#4ADE80" />;
    return <FileText size={20} color="#4A9FE7" />;
  };

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title={title} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {files.map((file, i) => (
          <div key={i} className="glass-card" style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {fileIcon(file.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{file.size}</div>
            </div>
            <button
              onClick={() => {
                haptic('light');
              }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--surface-glass)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--accent-blue)', flexShrink: 0,
              }}
            >
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== KITOB MATERIALLAR SCREEN ====================
function KitobScreen({ onBack }: { onNavigate?: (v: View, p?: any) => void; onBack: () => void }) {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const levels: LevelExt[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

  if (!selectedLevel) {
    return (
      <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ScreenHeader title="Kitob Materiallar" onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>
            Darajangizni tanlang — har bir darajada kitoblar, PDF, audio va videolar mavjud.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {levels.map((lvl) => (
              <button
                key={lvl}
                className="glass-card glass-card-hover"
                onClick={() => { haptic('light'); setSelectedLevel(lvl); }}
                style={{
                  padding: '20px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${LEVEL_COLORS[lvl]}20, ${LEVEL_COLORS[lvl]}08)`,
                  borderColor: `${LEVEL_COLORS[lvl]}40`,
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: LEVEL_COLORS[lvl] }}>{lvl.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {lvl === 'a1' || lvl === 'a2' ? 'Boshlang\'ich' : lvl === 'b1' || lvl === 'b2' ? 'O\'rta' : lvl === 'c1' ? 'Yuqori' : 'Mukammal'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const books = KITOB_FILES[selectedLevel] || [];

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title={`Kitob — ${selectedLevel.toUpperCase()}`} onBack={() => setSelectedLevel('')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {books.map((book, i) => (
          <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[selectedLevel]}30, ${LEVEL_COLORS[selectedLevel]}10)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={22} color={LEVEL_COLORS[selectedLevel]} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{book.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{book.desc}</div>
              </div>
            </div>

            {book.files.map((f, j) => (
              <div key={j} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', marginBottom: 6,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
              }}>
                {f.type === 'pdf' ? <FileText size={16} color="#F87171" /> : f.type === 'audio' ? <Headphones size={16} color="#4ADE80" /> : <Video size={16} color="#A78BFA" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.size}</div>
                </div>
                <button
                  onClick={() => { haptic('light'); }}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--accent-blue)',
                  }}
                >
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== KUNLIK SO'Z SCREEN ====================
function KunlikSozScreen({ onBack }: { onBack: () => void }) {
  const [dayIndex, setDayIndex] = useState(0);
  const word = DAILY_WORDS[dayIndex % DAILY_WORDS.length];
  const [learned, setLearned] = useState(false);

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Kunlik So'z" onBack={onBack} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        {/* Word Card */}
        <div className="glass-card" style={{ padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 12,
              background: word.art === 'das' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
              color: word.art === 'das' ? '#4ADE80' : '#F87171',
              fontSize: 12, fontWeight: 700,
            }}>
              {word.art}
            </span>
          </div>

          <div style={{
            fontSize: 28, fontWeight: 700, fontStyle: 'italic',
            color: 'white', marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            {word.de}
          </div>

          <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {word.uz}
          </div>

          <div style={{
            padding: 12, borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Misol:</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{word.example}"
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {word.note}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, width: '100%', maxWidth: 360 }}>
          <button
            onClick={() => {
              haptic('medium');
            }}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E5F9E, #4A9FE7)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', margin: '0 auto',
              boxShadow: '0 4px 16px rgba(30,95,158,0.4)',
            }}
          >
            <Volume2 size={24} />
          </button>

          {!learned ? (
            <button
              className="gradient-btn"
              onClick={() => {
                haptic('success');
                setLearned(true);
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={18} /> Yodladim ✅
              </span>
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: 12, color: 'var(--accent-green)', fontWeight: 600, fontSize: 13 }}>
              ✅ Bugunlik so'z yodlandi!
            </div>
          )}

          <button
            className="glass-btn"
            onClick={() => {
              haptic('light');
              setDayIndex(dayIndex + 1);
              setLearned(false);
            }}
          >
            Keyingi so'z →
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PROGRESSIM SCREEN ====================
function ProgressimScreen({ onBack }: { onBack: () => void }) {
  const stats = { words: 247, time: '42 soat', streak: 12, xp: 1250, level: 'a2' as Level, nextLevel: 2000 };
  const weekData = [45, 70, 30, 90, 60, 25, 55];
  const weekLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

  const progressPercent = Math.round((stats.xp / stats.nextLevel) * 100);

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Progressim" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { icon: BookOpen, label: "So'zlar", value: stats.words },
            { icon: Timer, label: 'Vaqt', value: stats.time },
            { icon: Star, label: 'Seriya', value: `${stats.streak} kun` },
          ].map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <s.icon size={18} color="var(--accent-blue)" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>XP Progress</span>
            <span style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{stats.xp} / {stats.nextLevel}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, #1E5F9E, #4A9FE7)',
              width: `${progressPercent}%`,
              transition: 'width 0.5s ease-out',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <LevelBadge level={stats.level} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{progressPercent}% → A2</span>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Haftalik faoliyat
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: 80 }}>
            {weekData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  height: `${(val / 100) * 60}px`,
                  minHeight: 4,
                  borderRadius: 4,
                  background: i === 3 ? 'linear-gradient(180deg, #4A9FE7, #60A5FA)' : 'rgba(255,255,255,0.12)',
                  transition: 'height 0.3s ease-out',
                }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{weekLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Level Badge */}
        <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${LEVEL_COLORS[stats.level]}40, ${LEVEL_COLORS[stats.level]}15)`,
            border: `3px solid ${LEVEL_COLORS[stats.level]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: LEVEL_COLORS[stats.level] }}>
              {stats.level.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Joriy daraja</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Keyingi: {stats.level === 'a1' ? 'A2' : stats.level === 'a2' ? 'B1' : stats.level === 'b1' ? 'B2' : 'C1'} daraja
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SOZLAMALAR SCREEN ====================
function SozlamalarScreen({ onBack }: { onBack: () => void }) {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [testReminder, setTestReminder] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [wordGoal, setWordGoal] = useState(10);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => { haptic('light'); onChange(!value); }}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--accent-blue)' : 'rgba(255,255,255,0.15)',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: 3,
        left: value ? 22 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Sozlamalar" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Profile */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 8 }}>Profil</div>
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1E5F9E, #4A9FE7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Foydalanuvchi</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@username</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Bildirishnomalar</div>
        <div className="glass-card" style={{ padding: 12, marginBottom: 16 }}>
          {[
            { label: "Kunlik so'z eslatmasi", value: dailyReminder, onChange: setDailyReminder },
            { label: 'Test eslatmasi', value: testReminder, onChange: setTestReminder },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: i === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>

        {/* Learning */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>O'rganish</div>
        <div className="glass-card" style={{ padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-play audio</span>
            <Toggle value={autoPlay} onChange={setAutoPlay} />
          </div>
          <div style={{ padding: '10px 4px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Kunlik so'z maqsadi: <strong style={{ color: 'var(--accent-blue)' }}>{wordGoal}</strong></div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => { haptic('light'); setWordGoal(n); }}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8,
                    border: wordGoal === n ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    background: wordGoal === n ? 'rgba(74,159,231,0.15)' : 'transparent',
                    color: wordGoal === n ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Haqida</div>
        <div className="glass-card" style={{ padding: 12 }}>
          {['Qo\'llanma', 'Biz haqimizda', 'Taklif va shikoyatlar'].map((item, i) => (
            <button
              key={i}
              className="glass-card-hover"
              onClick={() => { haptic('light'); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '10px 4px',
                borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                background: 'none', border: 'none', borderRadius: 0,
                color: 'var(--text-secondary)', fontSize: 13,
                cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {item}
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          ))}
          <div style={{ padding: '10px 4px 0', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            Sprechen mit Spass v2.0
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TEST SCREEN ====================
function TestScreen({ onNavigate, onBack }: { onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title="Test" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ClipboardList size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', color: 'var(--accent-amber)' }}>Grammatik Testlari</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Har bir darajada 20 ta bo'lim, har bir bo'limda 15 ta savol. Jami 1500 ta test!
            <br /><br />
            <span style={{ color: 'var(--accent-green)' }}>A1-A2-B1:</span> 20 soniya har bir savol
            <br />
            <span style={{ color: 'var(--accent-red)' }}>B2-C1:</span> 35 soniya har bir savol
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(['a1', 'a2', 'b1', 'b2', 'c1'] as Level[]).map((lvl) => (
            <button
              key={lvl}
              className="glass-card glass-card-hover"
              onClick={() => {
                haptic('light');
                onNavigate('test_sections', { level: lvl });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 18,
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: `linear-gradient(90deg, ${LEVEL_COLORS[lvl]}15, transparent)`,
                borderColor: `${LEVEL_COLORS[lvl]}30`,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[lvl]}40, ${LEVEL_COLORS[lvl]}15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: LEVEL_COLORS[lvl] }}>{lvl.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{lvl.toUpperCase()} Daraja</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>20 bo'lim • 300 ta savol</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="var(--accent-amber)" fill="var(--accent-amber)" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0%</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== TEST SECTIONS SCREEN ====================
function TestSectionsScreen({ payload, onNavigate, onBack }: { payload: any; onNavigate: (v: View, p?: any) => void; onBack: () => void }) {
  const { level } = payload || {};
  const sections = Array.from({ length: 20 }, (_, i) => ({
    num: i + 1,
    locked: i > 2, // First 3 unlocked as demo
    score: i < 3 ? [80, 60, 90][i] : 0,
  }));

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader title={`Test — ${level?.toUpperCase()}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {sections.map((s) => (
            <button
              key={s.num}
              className="glass-card glass-card-hover"
              onClick={() => {
                if (s.locked) { haptic('error'); return; }
                haptic('light');
                onNavigate('test_active', { level, section: s.num });
              }}
              disabled={s.locked}
              style={{
                padding: '14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: s.locked ? 'not-allowed' : 'pointer',
                opacity: s.locked ? 0.5 : 1,
                position: 'relative',
              }}
            >
              {s.locked && <Lock size={14} color="var(--text-muted)" />}
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: s.score > 0 ? LEVEL_COLORS[level] : 'white',
              }}>
                {s.num}
              </span>
              {s.score > 0 && (
                <span style={{ fontSize: 9, color: 'var(--accent-green)' }}>{s.score}%</span>
              )}
              {s.score > 0 && <CheckCircle2 size={14} color="var(--accent-green)" style={{ position: 'absolute', top: 6, right: 6 }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== TEST ACTIVE SCREEN ====================
function TestActiveScreen({ payload, onBack }: { payload: any; onBack: () => void }) {
  const { level, section } = payload || {};
  const questions = SAMPLE_TESTS[level as string] || SAMPLE_TESTS['a1'];
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(level === 'b2' || level === 'c1' ? 35 : 20);
  const [showResult, setShowResult] = useState(false);

  const timerDuration = level === 'b2' || level === 'c1' ? 35 : 20;

  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
      return;
    }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleAnswer = (idx: number) => {
    haptic('light');
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(answers[currentQ + 1]);
      setTimeLeft(timerDuration);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const correct = answers.filter((a, i) => a === questions[i].correct).length;
    const percent = Math.round((correct / questions.length) * 100);

    return (
      <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ScreenHeader title="Natija" onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {/* Score Circle */}
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: `conic-gradient(${percent >= 60 ? 'var(--accent-green)' : percent >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'} ${percent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: 'var(--water-deep)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>{percent}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{correct}/{questions.length}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24, width: '100%', maxWidth: 320 }}>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <CheckCircle2 size={20} color="var(--accent-green)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>{correct}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>To'g'ri</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <XCircle size={20} color="var(--accent-red)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-red)' }}>{questions.length - correct}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Xato</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <Timer size={20} color="var(--accent-blue)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)' }}>{timerDuration * questions.length}s</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Vaqt</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <button className="gradient-btn" onClick={() => { haptic('light'); setShowResult(false); setCurrentQ(0); setAnswers(new Array(questions.length).fill(null)); setSelected(null); setTimeLeft(timerDuration); }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RotateCcw size={16} /> Qayta urinish
              </span>
            </button>
            <button className="glass-btn" onClick={() => { haptic('light'); onBack(); }}>
              Asosiy menyu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const timerPercent = (timeLeft / timerDuration) * 100;
  const timerColor = timeLeft > timerDuration * 0.5 ? 'var(--accent-green)' : timeLeft > timerDuration * 0.25 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="view-enter" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Timer Bar */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bo'lim {section} — Savol {currentQ + 1}/{questions.length}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: timerColor, animation: timeLeft <= 5 ? 'timerPulse 0.5s infinite' : 'none' }}>
            {timeLeft}s
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: timerColor, width: `${timerPercent}%`, transition: 'width 1s linear' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Question */}
        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, fontStyle: 'italic', color: 'white', lineHeight: 1.6 }}>
            {q.q}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const labels = ['A', 'B', 'C', 'D'];
            const isSelected = selected === i;
            return (
              <button
                key={i}
                className="glass-card glass-card-hover"
                onClick={() => handleAnswer(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(74,159,231,0.1)' : 'var(--surface-glass)',
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: isSelected ? 'white' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {labels[i]}
                </span>
                <span style={{ fontSize: 14, color: 'white' }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === currentQ ? 'var(--accent-blue)' : answers[i] !== null ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)',
            }} />
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{
        position: 'sticky', bottom: 0, padding: 16,
        background: 'linear-gradient(0deg, rgba(11,29,58,0.95) 0%, rgba(11,29,58,0.6) 100%)',
        backdropFilter: 'blur(12px)',
      }}>
        <button
          className="gradient-btn"
          onClick={() => { haptic('medium'); handleNext(); }}
        >
          {currentQ < questions.length - 1 ? 'Keyingi →' : 'Tugatish'}
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
function App() {
  const [view, setView] = useState<View>('menu');
  const [payload, setPayload] = useState<any>(null);
  const [navStack, setNavStack] = useState<{ view: View; payload?: any }[]>([]);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0B1D3A');
      tg.setBackgroundColor('#0B1D3A');
    }
  }, []);

  const navigate = useCallback((newView: View, newPayload?: any) => {
    setNavStack(prev => [...prev, { view, payload }]);
    setPayload(newPayload);
    setView(newView);
  }, [view, payload]);

  const goBack = useCallback(() => {
    haptic('light');
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setView(prev.view);
      setPayload(prev.payload);
      setNavStack(prev => prev.slice(0, -1));
    } else {
      setView('menu');
      setPayload(null);
    }
  }, [navStack]);

  const renderView = () => {
    switch (view) {
      case 'menu': return <MainMenu onNavigate={navigate} />;
      case 'ai_mentor': return <AIMentorScreen onNavigate={navigate} onBack={goBack} />;
      case 'vorstellung': return <VorstellungScreen onBack={goBack} />;
      case 'aktiv_sprechen': return <AktivSprechenScreen onNavigate={navigate} onBack={goBack} />;
      case 'aktiv_words': return <AktivWordsScreen payload={payload} onNavigate={navigate} onBack={goBack} />;
      case 'aktiv_story': return <AktivStoryScreen payload={payload} onBack={goBack} />;
      case 'lugat': return <LugatScreen onNavigate={navigate} onBack={goBack} />;
      case 'lugat_words': return <LugatWordsScreen payload={payload} onBack={goBack} />;
      case 'tarjimon': return <TarjimonScreen onBack={goBack} />;
      case 'sayfa': return <SayfaScreen onNavigate={navigate} onBack={goBack} />;
      case 'sayfa_files': return <SayfaFilesScreen payload={payload} onBack={goBack} />;
      case 'kitob': return <KitobScreen onNavigate={navigate} onBack={goBack} />;
      case 'kunlik_soz': return <KunlikSozScreen onBack={goBack} />;
      case 'progressim': return <ProgressimScreen onBack={goBack} />;
      case 'sozlamalar': return <SozlamalarScreen onBack={goBack} />;
      case 'test': return <TestScreen onNavigate={navigate} onBack={goBack} />;
      case 'test_sections': return <TestSectionsScreen payload={payload} onNavigate={navigate} onBack={goBack} />;
      case 'test_active': return <TestActiveScreen payload={payload} onBack={goBack} />;
      default: return <MainMenu onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <FluidBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderView()}
      </div>
    </div>
  );
}

export default App;
