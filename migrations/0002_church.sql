-- Church site content and staff permissions. Public rows are world-readable.
-- Staff rows are keyed by the authenticated user id.

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists pages (
  slug text primary key,
  kicker text not null,
  title text not null,
  lede text not null
);

create table if not exists page_blocks (
  id serial primary key,
  page_slug text not null references pages (slug) on delete cascade,
  heading text not null,
  body text not null,
  sort_order int not null default 0
);

create table if not exists activities (
  id serial primary key,
  title text not null,
  audience text not null,
  body text not null,
  when_label text not null,
  sort_order int not null default 0
);

create table if not exists events (
  id serial primary key,
  kind text not null check (kind in ('vast', 'komend')),
  date_label text not null,
  title text not null,
  details text not null,
  sort_order int not null default 0
);

create table if not exists pastor (
  id int primary key,
  name text not null,
  role_label text not null,
  since_label text not null,
  email text not null,
  phone text not null,
  bio text not null
);

create table if not exists announcements (
  id serial primary key,
  title text not null,
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id serial primary key,
  name text not null,
  email text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists staff (
  user_id text primary key,
  email text not null,
  display_name text not null,
  role text not null check (role in ('eigenaar', 'beheerder', 'medewerker')),
  can_agenda boolean not null default false,
  can_content boolean not null default false,
  can_users boolean not null default false,
  can_audit boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id serial primary key,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  target text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists page_blocks_slug_idx on page_blocks (page_slug, sort_order);
create index if not exists audit_log_created_idx on audit_log (created_at desc);

insert into settings (key, value) values
  ('service_line', 'Elke zondag 10:00 uur · De Heuvel'),
  ('hero_title', 'Leven · Groeien'),
  ('hero_accent', 'Dienen · Delen'),
  ('hero_subtitle', 'Een warme gemeenschap van Jezus Christus in Pernis'),
  ('about_kicker', 'Sinds 1932 · De Heuvel'),
  ('about_title', 'Een levende gemeente in Pernis'),
  ('about_body', $b$In onze gemeente van Jezus Christus leven, groeien, dienen en delen wij. Wij hebben lief, omdat God van ons houdt.

Baptistengemeente Pernis is een warme, betrokken gemeenschap. We komen samen rond het Woord van God in Gemeentecentrum De Heuvel en verlangen ernaar dat alle generaties elkaar versterken in een leven met Jezus.

De gemeente is formeel opgericht op 22 januari 1947. Daarvoor waren mensen vanaf 1932 al actief met evangelisatie en kerkelijk werk. In 1981 bouwden we ons eigen kerkgebouw op de plek van de oude boerderij De Heuvel.$b$),
  ('mission', 'Een gemeenschap van Jezus Christus die leeft in relatie met de Drie-enige God, elkaar en de samenleving. We zijn in beweging, zichtbaar en vermenigvuldigen ons.'),
  ('vision', 'Tekenen van Gods Koninkrijk zichtbaar maken. Van een naar binnen gerichte naar een naar buiten gerichte gemeente.'),
  ('address_name', 'Baptistengemeente Pernis'),
  ('address_building', 'Gemeentecentrum "De Heuvel"'),
  ('address_street', 'Ring 322'),
  ('address_postal', '3195 XS Pernis'),
  ('kvk', '76461645'),
  ('email', 'info@baptistenpernis.nl'),
  ('youtube', 'https://www.youtube.com/@baptistengemeentepernis2194/streams'),
  ('iban', 'NL12 RABO 0353 2029 32'),
  ('iban_name', 'Baptisten Gemeente Pernis'),
  ('theme_kicker', 'Jaarthema 2025-2026'),
  ('theme_title', 'Seizoenen van ons geloof'),
  ('theme_intro', 'Geïnspireerd door Brian McLaren’s boek Naakte spiritualiteit denken we in twaalf eenvoudige woorden na over hoe geloof past bij vandaag.'),
  ('theme_words', $b$Hier|Aanwezig zijn
Dank|Dankbaarheid
O|Verwondering
Sorry|Berouw
Help|Hulp vragen
Alstublieft|Verzoek
Wanneer|Vertrouwen
Nee|Grenzen
Waarom|Vragen stellen
Zie|Zien en begrijpen
Ja|Toestemming
…|Stilte en rust$b$)
on conflict (key) do nothing;

insert into pastor (id, name, role_label, since_label, email, phone, bio) values (
  1,
  'Aernout de Jong',
  'Parttime voorganger',
  'Sinds 1 januari 2022',
  'voorganger@baptistenpernis.nl',
  '06-22687006',
  $b$Mijn naam is Aernout de Jong. Sinds 1 januari 2022 ben ik parttime voorganger van de Baptistengemeente Pernis. Na mijn studie theologie aan de Christelijke Hogeschool Ede (CHE) en het Baptistenseminarium ben ik voorganger geworden.

Ik ben het meest enthousiast over het goede nieuws wat God brengt in deze wereld. Ik geloof dat Hij kwam om ons te laten zien dat liefde ook kwetsbaar is. Jezus had Zijn leven ervoor over om mensen te laten zien dat God echt liefde geeft.

In deze wereld zien we dat het verhaal van God mensen uitdaagt om dat mysterie te ontdekken. In de kerk doen we dat met elkaar. We kiezen ervoor om samen te werken en er te zijn voor anderen. Ik vind het mooi om te zien dat onze gemeente bestaat uit jongeren en ouderen. Als voorganger wil ik de verbinding leggen tussen mensen en het geloof voor vandaag.

Je bent van harte welkom om contact met mij op te nemen of onze diensten te bezoeken.$b$
) on conflict (id) do nothing;

insert into pages (slug, kicker, title, lede) values
  ('gemeente', 'Onze gemeente', 'Geschiedenis, visie en samenwerken', 'We vormen een gemeenschap waarin alle generaties elkaar versterken in een leven met God.'),
  ('kinderen', 'Voor kinderen en jongeren', 'Crèche, zondagsschool en bijbelklas', 'Tijdens de dienst is er voor iedere leeftijd een eigen plek.'),
  ('lid-worden', 'Meedoen', 'Lid of vriend worden', 'De Baptistengemeente Pernis is een kerkelijke vereniging met leden en vrienden.'),
  ('bijdragen', 'Doe ook mee', 'Bijdragen met tijd of geld', 'Wil je meebouwen aan onze gemeente? Dat kan met je tijd, je talent of een gift.'),
  ('anbi', 'ANBI', 'Fiscaal aftrekbare giften', 'Als gemeente vallen wij onder de groepsbeschikking ANBI van de Unie van Baptistengemeenten in Nederland.'),
  ('nieuw', 'Voor het eerst', 'Nieuw hier?', 'Een kerk gaat niet om het gebouw, maar om de mensen die daar samen hun geloof en hun dagelijks leven delen.'),
  ('seizoenen', 'Jaarthema 2025-2026', 'Seizoenen van ons geloof', 'We zoeken naar een manier waarop geloven past bij vandaag.')
on conflict (slug) do nothing;

insert into page_blocks (page_slug, heading, body, sort_order)
select v.page_slug, v.heading, v.body, v.sort_order
from (values
  ('gemeente', 'Geschiedenis', $b$De Baptistengemeente Pernis is formeel opgericht op 22 januari 1947. Daarvoor waren mensen vanaf 1932 al actief in en om Pernis met evangelisatie en kerkelijk werk. Vanuit die activiteiten is de gemeente ontstaan.

In juni 1948 waren 29 mensen lid. Door de jaren heen is dat aantal gegroeid. De afgelopen jaren zijn 90 tot 100 mensen lid, en ongeveer 25 mensen hebben zich ingeschreven als vriend van de gemeente.

In 1981 bouwden we ons eigen kerkgebouw op de plek van de oude boerderij De Heuvel, aan de Ring in Pernis.$b$, 1),
  ('gemeente', 'Leden, bestuur en gemeentevergadering', $b$De leden kiezen de mensen die het bestuur vormen. Daarnaast zijn mensen actief in werkgroepen, begeleid door een coördinator.

Besluiten over beleid en andere belangrijke zaken worden genomen in de gemeentevergadering. Daar heeft elk lid gelijk stemrecht. Het bestuur bereidt vergaderingen voor, voert besluiten uit, handelt dagelijkse zaken af en onderhoudt contacten met andere kerken, baptistengemeenten en hulporganisaties.$b$, 2),
  ('gemeente', 'Vrienden', $b$Mensen die geen lid zijn, kunnen wel vriend worden. Zij kunnen meedraaien in werkgroepen, bijeenkomsten bezoeken en een beroep doen op onderlinge ondersteuning. Vrienden hebben geen stemrecht in de gemeentevergadering.$b$, 3),
  ('kinderen', 'Crèche', $b$Voor de allerjongste kinderen, tot ongeveer 4 jaar, is er een crèche op zondagmorgen tijdens de kerkdienst. Zij kunnen daar al voordat de dienst begint terecht.

In de crècheruimte is speelgoed voor de wat grotere kinderen en een box of speelkleed voor de allerkleinsten. Ervaren leidsters zijn bij de kinderen, helpen met spelen, eten en drinken, en lezen voor.$b$, 1),
  ('kinderen', 'Zondagsschool', $b$De zondagsschool is voor kinderen van 4 tot 12 jaar. Zij beginnen samen met de gemeente in de grote zaal. Kort na de start gaan ze naar de zondagsschool, en ze komen terug net voordat de voorganger de zegen uitspreekt.

Er wordt gezongen, soms een filmpje gekeken op het digibord, en vaak geknutseld. Bij mooi weer kan er gespeeld worden in de speeltuin in het park achter het kerkgebouw.$b$, 2),
  ('kinderen', 'Bijbelklas', $b$Jongeren vanaf 12 jaar zijn tijdens de dienst welkom in de bijbelklas. Het gaat over de Bijbel, en vooral over wat die vandaag praktisch betekent. Vragen en ervaringen van jongeren krijgen ruimte.

Gesprek en uitwisseling zijn belangrijk. Soms komt een ouder lid langs om een levensverhaal te vertellen.$b$, 3),
  ('lid-worden', 'Lid worden', $b$Om lid te kunnen worden willen we je graag eerst beter leren kennen. We vragen of je gelooft in Jezus Christus. Als je daar volmondig ja op kunt zeggen, is de volgende stap de doop.

Die doop is jouw persoonlijke stap, zichtbaar voor iedereen, dat je bij Jezus wilt horen. In onze gemeente gebeurt de doop door onderdompeling: je gaat even helemaal onder water, ondersteund door een paar mensen, en staat daarna weer op. Die manier van dopen staat in de Bijbel.

Als lid mag je meebeslissen over beleid, de besteding van geld en andere onderwerpen die in de gemeentevergadering aan de orde komen.$b$, 1),
  ('lid-worden', 'Vriend worden', $b$Mensen die bij de gemeente willen horen zonder lid te worden, kunnen vriend worden. Vrienden zijn net zo welkom als ieder ander. Als je dat wilt, komen je contactgegevens in het adressenboek, zodat je voor elkaar te vinden bent.

Vrienden hebben geen stemrecht tijdens gemeentevergaderingen.$b$, 2),
  ('bijdragen', 'Tijd, vaardigheid of talent', $b$Voor allerlei taken is inzet van mensen nodig. Vele handen maken licht werk, bijvoorbeeld bij de schoonmaak van het gebouw of het klaarmaken van voedselpakketten.

Je kunt ook groepen kinderen of jongeren begeleiden, muzikaal meespelen, of je tijd en talent inzetten voor mensen die steun nodig hebben.$b$, 1),
  ('bijdragen', 'Financieel bijdragen', $b$De gemeente heeft geld nodig voor het salaris van de voorganger, verwarming en onderhoud van het gebouw, en voor activiteiten voor anderen. Zoals voedselpakketten voor mensen die het nodig hebben en net niet in aanmerking komen voor de Voedselbank.

Giften kunnen worden overgemaakt naar IBAN NL12 RABO 0353 2029 32 t.n.v. Baptisten Gemeente Pernis. Vermeld waarvoor het bedrag bedoeld is.

De gemeente is een algemeen nut beogende instelling (ANBI). Een gift of schenking is daarom onder voorwaarden fiscaal aftrekbaar.$b$, 2),
  ('anbi', 'Wat houdt de ANBI-status in?', $b$Als gemeente zijn wij lid van de Unie van Baptistengemeenten in Nederland. De Unie heeft van de Belastingdienst een groepsbeschikking ANBI gekregen. Giften aan onze gemeente zijn onder voorwaarden fiscaal aftrekbaar. Dat geeft een belastingvoordeel.

Voor nadere informatie kun je mailen naar info@baptistenpernis.nl.

Een ANBI is sinds 1 januari 2016 verplicht een aantal gegevens op de website te publiceren. Het actuele ANBI-formulier staat als PDF op de website van de gemeente.$b$, 1),
  ('anbi', 'Gegevens', $b$Baptistengemeente Pernis
Gemeentecentrum De Heuvel
Ring 322
3195 XS Pernis
KvK-nummer: 76461645
E-mail: info@baptistenpernis.nl

Het formulier: https://baptistenpernis.nl/wp-content/uploads/2026/07/ANBI-2026.pdf$b$, 2),
  ('nieuw', 'De samenkomst op zondag', $b$Je leest hier hoe een zondagse dienst bij ons ongeveer gaat. Online blijft dat lastig, omdat een kerk om mensen gaat. Het gebouw is niet het hart. De mensen die daar samenkomen wel.

We noemen het een kerkdienst, maar samenkomst of eredienst mag ook. Het gaat om de bijeenkomst op zondagmorgen, in de grote zaal, ongeveer een tot anderhalf uur.$b$, 1),
  ('nieuw', 'Kinderen tijdens de dienst', $b$We beginnen met elkaar. Omdat anderhalf uur lang kan zijn, kunnen kinderen al snel naar een eigen bijeenkomst: de crèche, de zondagsschool of de bijbelklas. Ze komen terug voor de zegen.$b$, 2),
  ('nieuw', 'Staan, zitten, meedoen', $b$Bij ons gebeurt er niets zomaar ineens. Als het de bedoeling is dat iedereen gaat staan, wordt daar duidelijk om gevraagd. Bijvoorbeeld: zullen we dit lied, voor zover je dat kunt, staande zingen? Als opstaan lastig is, blijf je gewoon zitten.$b$, 3),
  ('nieuw', 'Zingen', $b$We zingen liederen uit bundels zoals Liederen voor de Gemeentezang en Opwekking. In de eerste bundel staan ook de 150 psalmen, in een zingbare tekst, plus liederen uit verschillende eeuwen. Opwekking krijgt elk jaar nieuwe liederen, soms origineel Nederlands, soms een vertaling.

De teksten worden groot geprojecteerd. Een bundel is handig om thuis nog eens te lezen, maar je hebt hem in de zaal niet nodig.

Een deel van de liederen begeleiden we met orgel, meestal de oudere samenzang. Andere liederen zingen we met het combo: piano of keyboard, drums en elektrische gitaar, soms een accordeon of een andere instrumentalist. We proberen orgel en combo ongeveer half om half te verdelen.$b$, 4),
  ('nieuw', 'Bidden, Bijbel en preek', $b$Samen bidden verbindt ons leven met God. Aan het begin vragen we om aanwezigheid, rust en aandacht. Later is er voorbede en dankgebed. In het gebouw ligt een gebedenboek, en via andere wegen komen ook punten binnen. Iemand uit het gebedsteam spreekt die uit, namens anderen.

Er worden een of meer Bijbelgedeelten gelezen, door de voorganger of iemand die de dienst voorbereidde. De tekst staat op de beamer. Meerdere vertalingen zijn in gebruik, van de Statenvertaling tot de Nieuwe Bijbelvertaling van 2021 en de Bijbel in Gewone Taal.

De preek is geen eenrichtingsverkeer. Voorgangers vragen regelmatig om een reactie of een mening, en gebruiken soms de beamer voor een beeld of een aandachtspunt.$b$, 5),
  ('nieuw', 'Collecte en avondmaal', $b$Tijdens of na de dienst is er een collecte. Je kunt geven in de mandjes bij de uitgang, of via de Givt-app. Meestal zijn er twee collectes: één voor de gemeente (verwarming, licht, koffie, lidmaatschap van de Unie van Baptistengemeenten) en één voor een diaconaal doel, zoals voedselpakketten in Pernis of een organisatie als Mercy Ships.

Elke eerste zondag van de maand is er avondmaal. We gedenken de maaltijd van Jezus met zijn vrienden, vóór zijn lijden, dood en opstanding. Brood en beker wijzen naar het nieuwe verbond. We gebruiken druivensap. Je mag de schaal doorgeven zonder mee te doen. Mee doen is een uitnodiging voor wie gelooft dat het offer van Jezus zonden wegneemt, niet een verplichting.$b$, 6),
  ('nieuw', 'Na afloop', $b$Na de dienst is er koffie, thee en sap. Bij een verjaardag of jubileum staat er vaak iets lekkers bij. Mensen praten na over de dienst, of over heel andere dingen.

Kun je er niet bij zijn, dan is de dienst ook te volgen via het YouTube-kanaal van de gemeente.$b$, 7),
  ('seizoenen', 'Het jaarthema', $b$Het jaarthema voor het seizoen 2025-2026 is Seizoenen van ons geloof.

We gebruiken hiervoor het boek Naakte spiritualiteit van Brian McLaren, schrijver en theoloog uit de Verenigde Staten. Hij zoekt naar een manier waarop geloven past bij vandaag.

In twaalf eenvoudige woorden denken we vanuit de seizoenen na over ons geloof: Hier, Dank, O, Sorry, Help, Alstublieft, Wanneer, Nee, Waarom, Zie, Ja, en stilte.

Van harte welkom om hierover mee te denken en te praten.$b$, 1)
) as v(page_slug, heading, body, sort_order)
where not exists (select 1 from page_blocks);

insert into activities (title, audience, body, when_label, sort_order)
select v.title, v.audience, v.body, v.when_label, v.sort_order
from (values
  ('Rock Solid', 'Tieners', $b$De kerken in Pernis werken samen in het jeugdwerk, onder andere met Rock Solid voor tieners van klas 1 tot en met 3 van het voortgezet onderwijs. Gemiddeld komen zo’n vijftien tieners. De avonden zijn ongeveer twee keer per maand in De Heuvel.

Rock Solid helpt tieners zich te ontwikkelen op sociaal, fysiek, psychisch en geestelijk vlak. Praktisch zijn het avonden met humor, sport en spel, muziek, discussie en een korte bijbeluitleg.$b$, 'Vrijdagavond · De Heuvel', 1),
  ('Haken en breien', 'Praktisch', $b$Elke maandagmorgen vanaf 10:00 uur zijn mensen, vooral dames, actief met haken en breien in De Bontekoe. Er worden kledingstukken gemaakt voor mensen in Roemenië. Het is gezellig en praktisch tegelijk, en de kring is interkerkelijk.$b$, 'Maandag 10:00 · De Bontekoe', 2),
  ('Interkerkelijke gebedsavond', 'Samen bidden', $b$In de kerken in Pernis, ook bij ons, heeft gebed een belangrijke plaats. Gebed is niet aan één kerk gebonden: het is contact zoeken met God, hardop of in stilte.

De interkerkelijke gebedskring komt bijeen op de laatste vrijdagavond van de maand.$b$, 'Laatste vrijdagavond · wisselend', 3)
) as v(title, audience, body, when_label, sort_order)
where not exists (select 1 from activities);

insert into events (kind, date_label, title, details, sort_order)
select v.kind, v.date_label, v.title, v.details, v.sort_order
from (values
  ('vast', 'Elke zondag', 'Zondagse dienst', '10:00 uur in De Heuvel. Iedereen welkom. De dienst is ook te volgen via YouTube.', 1),
  ('vast', 'Elke eerste zondag', 'Avondmaal', 'Het avondmaal is onderdeel van de zondagse dienst.', 2),
  ('vast', 'Elke maandagochtend', 'Koffie en handwerken', 'Vanaf 10:00 uur in De Bontekoe. Interkerkelijk.', 3),
  ('vast', 'Laatste vrijdagavond', 'Interkerkelijke gebedskring', 'In de consistorie van de Hervormde Kerk.', 4),
  ('komend', 'Zondag 11 oktober 2026', 'Buurtlunch in de Bonte Koe', 'Maandelijkse buurtlunch van de Buurtkerk in het Huis van de Wijk. Aanvang 12:30, inloop vanaf 12:00. Aanmelden vóór 5 oktober via ckk@baptistenpernis.nl of Corrie, 06-17097917.', 1),
  ('komend', 'Zondag 8 november 2026', 'Buurtlunch in de Bontekoe', 'Maandelijkse buurtlunch. Aanvang 12:30, inloop vanaf 12:00. Aanmelden vóór 2 november via ckk@baptistenpernis.nl of Corrie, 06-40909306.', 2)
) as v(kind, date_label, title, details, sort_order)
where not exists (select 1 from events);
