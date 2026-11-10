-- Extra public page plus an optional pastor photo the staff can upload.

alter table pastor add column if not exists photo text not null default '';

insert into pages (slug, kicker, title, lede) values
  (
    'diaconie',
    'Helpende hand',
    'Diaconie en pastoraat',
    'Dichtbij in Pernis en verder weg: praktische hulp en aandacht voor elkaar.'
  )
on conflict (slug) do nothing;

insert into page_blocks (page_slug, heading, body, sort_order)
select v.page_slug, v.heading, v.body, v.sort_order
from (values
  (
    'diaconie',
    'Diaconaat',
    $b$Woordenboeken geven als betekenis van diaconaat: kerkelijke dienst van de barmhartigheid, of kerkelijke hulpverlening aan armen en zieken. Ook de Baptistengemeente Pernis helpt via onze diaconie mensen die steun en hulp nodig hebben. Dichtbij in Pernis of verder weg.

Ondanks voorzieningen van bijvoorbeeld de overheid, kunnen mensen om allerlei redenen toch extra steun en hulp nodig hebben. De diaconie schakelt daarvoor vrijwilligers in en werft geld om financieel te kunnen bijspringen. Leden en vrienden van Baptistengemeente Pernis brengen regelmatig levensmiddelen en huishoudelijke producten mee naar de kerk voor boodschappenpakketten. Die pakketten worden gebracht bij mensen in Pernis die dat nodig hebben. Bijvoorbeeld omdat ze weinig geld hebben, maar net niet in aanmerking komen voor de Voedselbank.

Verder worden collectes gehouden om diaconale doelen financieel te steunen. Zoals de organisatie Mercy Ships, die met ziekenhuisschepen vaart naar de armste landen in Afrika om daar medische zorg mogelijk te maken door training en operaties. Chirurgische zorg maakt deze organisatie toegankelijk voor de allerarmsten.$b$,
    1
  ),
  (
    'diaconie',
    'Pastoraat',
    $b$Het pastoraat heeft alles te maken met aandacht voor elkaar, luisteren en bemoedigen. Het wordt ook wel geestelijke verzorging genoemd. Veel mensen komen in hun leven situaties en ervaringen tegen die lastig zijn of pijn doen. Dat roept allerlei vragen en emoties op. Vragen of pijn waarover je met iemand wil praten. Om antwoorden te krijgen, of gewoon om je hart eens te luchten. Of om te horen hoe anderen tegen die situatie aankijken.

Voor mensen die geloven leveren moeilijke situaties en nare of schokkende ervaringen soms nog meer vragen op. Omdat dan ineens vragen opduiken die te maken hebben met wat je gelooft en hoe je gelooft. Bijvoorbeeld over de rol die je geloof in God kan hebben. En of je geloof of God kan helpen om weer nieuwe moed en kracht te krijgen.

Bij Baptistengemeente Pernis zijn zowel de voorganger als andere mensen actief bezig met pastoraal werk. Want gewoon bij mensen op de koffie gaan voor een goed gesprek, of ze ondersteunen in moeilijke periodes van bijvoorbeeld ziekte, kan eigenlijk iedereen.

Sommige ingrijpende gebeurtenissen vragen om meer dan aandacht door een prettig bezoek. Bijvoorbeeld bij ernstige ziekte, het overlijden van een naaste, pijnlijke problemen in relaties of diepgaande geloofsvragen. Dan is de kennis en ervaring van een ervaren geestelijke verzorger zoals de voorganger nodig. Een onderdeel van pastoraat kan ook het samen bidden zijn. Samen contact zoeken met God. De moeilijkheden in gebed uitspreken en vragen om hulp, kracht en zegen.

Pastorale zorg is met name bedoeld voor de leden en vrienden van de gemeente. Doordat zij elkaar al op een bepaalde manier kennen, is het goed mogelijk om met elkaar te spreken in moeilijke tijden.$b$,
    2
  )
) as v(page_slug, heading, body, sort_order)
where not exists (select 1 from page_blocks where page_slug = 'diaconie');
