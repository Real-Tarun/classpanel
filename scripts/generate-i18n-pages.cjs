/**
 * ClassPanel i18n Page Generator
 * Generates translated HTML pages for all 23 tools × 3 languages = 69 pages
 * Also generates translated homepages for each language
 * 
 * Run: node scripts/generate-i18n-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LANGUAGES = ['es', 'fr', 'de'];
const LANG_NAMES = { es: 'Español', fr: 'Français', de: 'Deutsch' };
const LANG_FLAGS = { es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪' };

// All 23 tools with their metadata
const TOOLS = [
  { slug: 'classroom-timer', en_title: 'Classroom & Study Timer', es_title: 'Temporizador de Clase y Estudio', fr_title: 'Minuterie de Classe et d\'Étude', de_title: 'Unterrichts- und Lerntimer', category: 'timers' },
  { slug: 'race-timers', en_title: 'Race Timers & F1 Start Lights', es_title: 'Temporizadores de Carrera', fr_title: 'Minuteries de Course', de_title: 'Renntimer & F1-Startlichter', category: 'timers' },
  { slug: 'holiday-timers', en_title: 'Countdown to Any Date', es_title: 'Cuenta Regresiva a Cualquier Fecha', fr_title: 'Compte à Rebours vers une Date', de_title: 'Countdown bis zu einem Datum', category: 'clocks' },
  { slug: 'random-name-picker', en_title: 'Wheel of Names & Picker', es_title: 'Ruleta de Nombres', fr_title: 'Roue des Prénoms', de_title: 'Namenrad & Auswahlrad', category: 'randomizers' },
  { slug: 'random-number-generator', en_title: 'Random Number Generator', es_title: 'Generador de Números Aleatorios', fr_title: 'Générateur de Nombres Aléatoires', de_title: 'Zufallszahlengenerator', category: 'randomizers' },
  { slug: 'sensory-timer', en_title: 'Sensory & Meditation Timer', es_title: 'Temporizador Sensorial y de Meditación', fr_title: 'Minuterie Sensorielle et Méditation', de_title: 'Sensorischer Meditationstimer', category: 'timers' },
  { slug: 'clocks', en_title: 'Online Clock & Display', es_title: 'Reloj en Línea', fr_title: 'Horloge en Ligne', de_title: 'Online-Uhr & Anzeige', category: 'clocks' },
  { slug: 'exam-timer', en_title: 'Official Exam Timer', es_title: 'Temporizador Oficial de Examen', fr_title: 'Minuterie d\'Examen Officielle', de_title: 'Offizieller Prüfungstimer', category: 'timers' },
  { slug: 'chance-games', en_title: 'Chance Games & Mystery Hub', es_title: 'Juegos de Azar y Misterio', fr_title: 'Jeux de Hasard et Mystère', de_title: 'Glücksspiele & Mystery-Hub', category: 'games' },
  { slug: 'group-generator', en_title: 'Random Group Generator', es_title: 'Generador de Grupos Aleatorios', fr_title: 'Générateur de Groupes Aléatoires', de_title: 'Zufallsgruppengenerator', category: 'randomizers' },
  { slug: 'presentation-timer', en_title: 'Toastmasters & Speech Timer', es_title: 'Temporizador de Presentación', fr_title: 'Minuterie de Présentation', de_title: 'Präsentationstimer', category: 'timers' },
  { slug: 'tally-counter', en_title: 'Online Tally Counter', es_title: 'Contador Digital', fr_title: 'Compteur en Ligne', de_title: 'Online-Strichzähler', category: 'clocks' },
  { slug: 'rock-paper-scissors', en_title: 'Rock Paper Scissors', es_title: 'Piedra Papel Tijera', fr_title: 'Pierre Papier Ciseaux', de_title: 'Schere Stein Papier', category: 'games' },
  { slug: 'coin-flip', en_title: 'Flip a Coin Simulator', es_title: 'Lanzar Moneda', fr_title: 'Lancer une Pièce', de_title: 'Münzwurf-Simulator', category: 'games' },
  { slug: 'dice-roller', en_title: 'Polyhedral Dice Roller', es_title: 'Lanzador de Dados Poliédricos', fr_title: 'Lanceur de Dés Polyédriques', de_title: 'Vielflächiger Würfelwurf', category: 'games' },
  { slug: 'color-picker', en_title: 'Color Picker & Converter', es_title: 'Selector de Color', fr_title: 'Sélecteur de Couleur', de_title: 'Farbwähler & Konverter', category: 'clocks' },
  { slug: 'stopwatch', en_title: 'Online Stopwatch & Laps', es_title: 'Cronómetro en Línea', fr_title: 'Chronomètre en Ligne', de_title: 'Online-Stoppuhr', category: 'timers' },
  // New tools
  { slug: 'metronome', en_title: 'Online Metronome', es_title: 'Metrónomo en Línea', fr_title: 'Métronome en Ligne', de_title: 'Online-Metronom', category: 'clocks' },
  { slug: 'chess-timer', en_title: 'Chess Clock & Timer', es_title: 'Reloj de Ajedrez', fr_title: "Horloge d'Échecs", de_title: 'Schachuhr', category: 'timers' },
  { slug: 'talking-clock', en_title: 'Talking Clock', es_title: 'Reloj Parlante', fr_title: 'Horloge Parlante', de_title: 'Sprechende Uhr', category: 'clocks' },
  { slug: 'bomb-countdown', en_title: 'Bomb Countdown Timer', es_title: 'Temporizador de Bomba', fr_title: 'Minuterie Bombe', de_title: 'Bomben-Countdown-Timer', category: 'games' },
  { slug: 'custom-timer', en_title: 'Make Your Own Timer', es_title: 'Crea tu Propio Temporizador', fr_title: 'Créez votre Propre Minuterie', de_title: 'Eigenen Timer Erstellen', category: 'timers' },
  { slug: 'split-timer', en_title: 'Split / Lap Timer', es_title: 'Cronómetro de Vueltas', fr_title: 'Chronomètre à Tours', de_title: 'Split-/Rundenzeitmesser', category: 'timers' },
];

// Descriptions per tool per language
const TOOL_DESCS = {
  es: {
    'classroom-timer': 'Temporizador de cuenta regresiva gigante y temporizador Pomodoro con música ambiental, barra de progreso y campanas para clases y estudio.',
    'race-timers': 'Cuenta regresiva de sprint animada y simulador de luces de salida de Fórmula 1 para medir tiempos de reacción en milisegundos.',
    'holiday-timers': 'Contador en vivo para cumpleaños, plazos, festividades y eventos con modo de transmisión en vivo y enlaces para compartir.',
    'random-name-picker': 'Emocionante ruleta giratoria para listas de estudiantes, sorteos y decisiones con la opción de eliminar al elegir.',
    'random-number-generator': 'Genera números en rangos personalizados para rifas, loterías, dados de juego y probabilidad matemática con historial.',
    'sensory-timer': 'Temporizadores visuales calmantes con burbujas de lava, respiración cuadrada guiada (4-4-4-4) y cuenco cantante.',
    'clocks': 'Esfera de reloj analógico de pantalla completa y visualización de hora digital con modos de 12/24 horas, vista de escritorio y modo de quiz.',
    'exam-timer': 'Tablero de examen oficial con reloj en vivo sincronizado, recordatorios silenciosos por hito y período de lectura.',
    'chance-games': 'Juegos interactivos de azar: gira la Ruleta de Premios, desbloquea Cofres del Tesoro 3D y consulta la Bola Mágica 8.',
    'group-generator': 'Divide clases, colegas o jugadores en equipos o parejas equilibradas al instante con exportación de arrastrar y soltar.',
    'presentation-timer': 'Cronómetro de presentaciones con indicadores de semáforo automatizados (Verde, Ámbar, Rojo) para Toastmasters y debates.',
    'tally-counter': 'Contador de clic multi-pista y marcador. Registra repeticiones de ejercicio, recuentos de inventario, votos y asistencia.',
    'rock-paper-scissors': 'Juego animado rápido contra la computadora con modos de mejor de 3/5/7, retroalimentación instantánea y seguimiento de rachas.',
    'coin-flip': 'Lanzamiento de moneda 3D metálico satisfactorio con efectos de sonido, tiradas múltiples (1 a 5 monedas) y seguimiento de probabilidad.',
    'dice-roller': 'Lanza dados poliédricos RPG (d4, d6, d8, d10, d12, d20, d100) con totales acumulados, animación física y historial.',
    'color-picker': 'Selector de color visual con copia con 1 clic para HEX, RGB, HSL y CMYK, paletas seleccionadas y verificación de contraste WCAG.',
    'stopwatch': 'Cronómetro de cuenta ascendente con precisión de milisegundos con registro de vueltas y comparación de más rápida/más lenta.',
    'metronome': 'Metrónomo ajustable de 40 a 208 BPM con indicador de beat visual, tap tempo, compases (4/4, 3/4, 6/8) y control de volumen.',
    'chess-timer': 'Reloj de ajedrez para dos jugadores con controles de tiempo Blitz, Rápido y Personalizado. Toca los paneles para cambiar los relojes.',
    'talking-clock': 'Reloj que lee la hora en voz alta usando texto a voz del navegador. Anuncio automático cada 1, 5, 10 o 30 minutos.',
    'bomb-countdown': 'Cuenta regresiva gamificada con animación de mecha ardiente, cambios de color que generan tensión y animación de explosión al llegar a cero.',
    'custom-timer': 'Crea una cuenta regresiva personalizada con tu propia etiqueta, color de tema, sonido de fin y duración. Guarda tu configuración.',
    'split-timer': 'Cronómetro con botón de Vuelta que registra tiempos de split con delta respecto a la vuelta anterior. Insignias de más rápida/más lenta.',
  },
  fr: {
    'classroom-timer': 'Minuterie géante et chronomètre Pomodoro avec musique d\'ambiance, barre de progression et sonneries pour les cours.',
    'race-timers': 'Compte à rebours de sprint animé et simulateur de feux de départ Formule 1 pour mesurer les temps de réaction en millisecondes.',
    'holiday-timers': 'Compte à rebours en direct pour anniversaires, échéances, fêtes et événements avec mode de diffusion en direct.',
    'random-name-picker': 'Roue tournante passionnante pour les listes d\'élèves, tirages au sort et décisions avec option d\'élimination à la sélection.',
    'random-number-generator': 'Génère des nombres dans des plages personnalisées pour tombolas, loteries, dés de jeu et probabilités mathématiques.',
    'sensory-timer': 'Minuteries visuelles apaisantes avec bulles de lave, respiration carrée guidée (4-4-4-4) et bol chantant.',
    'clocks': 'Cadran d\'horloge analogique plein écran et affichage de l\'heure numérique avec modes 12/24 heures et mode quiz.',
    'exam-timer': 'Tableau d\'examen officiel avec horloge murale synchronisée en direct, rappels silencieux et période de lecture.',
    'chance-games': 'Jeux de hasard interactifs : faites tourner la Roue des Prix, déverrouillez des Coffres au Trésor 3D et consultez la Boule Magique 8.',
    'group-generator': 'Divisez des classes, des collègues ou des joueurs en équipes ou paires équilibrées instantanément avec export par glisser-déposer.',
    'presentation-timer': 'Minuterie de présentation avec indicateurs de feux de circulation automatisés (Vert, Ambre, Rouge) pour Toastmasters et débats.',
    'tally-counter': 'Compteur de clics multi-pistes et tableau de bord. Suivez les répétitions, les décomptes d\'inventaire, les votes et l\'assiduité.',
    'rock-paper-scissors': 'Jeu animé rapide contre l\'ordinateur avec modes meilleur de 3/5/7, retour instantané et suivi des séries.',
    'coin-flip': 'Lancer de pièce 3D métallique satisfaisant avec effets sonores, tirages multiples (1 à 5 pièces) et suivi des probabilités.',
    'dice-roller': 'Lance des dés polyédriques RPG (d4, d6, d8, d10, d12, d20, d100) avec totaux cumulatifs, animation physique et historique.',
    'color-picker': 'Sélecteur de couleur visuel avec copie en 1 clic pour HEX, RGB, HSL et CMYK, palettes soigneusement choisies et vérification de contraste WCAG.',
    'stopwatch': 'Chronomètre de compte à rebours montant avec précision à la milliseconde, enregistrement des tours et comparaison du plus rapide/plus lent.',
    'metronome': 'Métronome ajustable de 40 à 208 BPM avec indicateur de temps visuel, frappe du tempo, mesures (4/4, 3/4, 6/8) et contrôle du volume.',
    'chess-timer': 'Horloge d\'échecs à deux joueurs avec contrôles de temps Blitz, Rapide et Personnalisé. Appuyez sur les panneaux pour changer d\'horloge.',
    'talking-clock': 'Horloge qui lit l\'heure à voix haute en utilisant la synthèse vocale du navigateur. Annonce automatique toutes les 1, 5, 10 ou 30 minutes.',
    'bomb-countdown': 'Compte à rebours ludique avec animation de mèche qui brûle, changements de couleur pour la tension et animation d\'explosion à zéro.',
    'custom-timer': 'Créez un compte à rebours personnalisé avec votre propre étiquette, couleur de thème, son de fin et durée. Sauvegardez votre configuration.',
    'split-timer': 'Chronomètre avec bouton Tour qui enregistre les temps de split avec delta par rapport au tour précédent. Badges du plus rapide/plus lent.',
  },
  de: {
    'classroom-timer': 'Riesiger digitaler Countdown-Timer und Pomodoro-Lerntimer mit beruhigender Umgebungsmusik, Fortschrittsbalken und Glockentönen.',
    'race-timers': 'Animierter Sprint-Countdown und Formel-1-Startlicht-Reaktionssimulator zum Messen von Startreaktionszeiten in Millisekunden.',
    'holiday-timers': 'Live-Countdown-Ticker für Geburtstage, Fristen, Feiertage und Veranstaltungen mit OBS-Livestream-Modus und teilbaren Links.',
    'random-name-picker': 'Aufregendes Drehrad für Schülerroster, Gewinnspiele und tägliche Entscheidungen mit Eliminierungsfunktion.',
    'random-number-generator': 'Generiert Zahlen in benutzerdefinierten Bereichen für Tombolas, Lotterien, Spielwürfel und mathematische Wahrscheinlichkeiten.',
    'sensory-timer': 'Beruhigende visuelle Timer mit Lavablasen, geführter quadratischer Atemübung (4-4-4-4) und Klangschale.',
    'clocks': 'Ästhetische Vollbild-Analoguhr und digitale Zeitanzeige mit 12/24-Stunden-Modi, Schreibtischansicht und Quizmodus.',
    'exam-timer': 'Offizielles Prüfungsbrett mit synchronisierter Live-Wanduhr, stillen Meilensteinerinnerungen und Lesezeit.',
    'chance-games': 'Interaktive Glücksspiele: Drehen Sie das Glückspreisrad, öffnen Sie 3D-Schatzruhen und befragen Sie den Kosmischen Magic 8-Ball.',
    'group-generator': 'Teilen Sie Klassen, Kollegen oder Turnierspieler sofort in ausgewogene Teams oder Paare auf mit Drag-and-Drop-Export.',
    'presentation-timer': 'Präsentations-Timer mit automatisierten Ampel-Indikatoren (Grün, Gelb, Rot) für Toastmasters, Konferenzvorträge und Debatten.',
    'tally-counter': 'Mehrspuriger Klickzähler und Anzeigetafel. Verfolgen Sie Übungswiederholungen, Bestandszählungen, Abstimmungen und Anwesenheit.',
    'rock-paper-scissors': 'Schnelles animiertes Spiel gegen den Computer mit Best-of-3/5/7-Modi, sofortigem Feedback und Gewinnstreifen-Verfolgung.',
    'coin-flip': 'Befriedigender metallischer 3D-Münzwurf mit Soundeffekten, Mehrfachwürfen (1 bis 5 Münzen gleichzeitig) und Live-Wahrscheinlichkeitsverfolgung.',
    'dice-roller': 'Wirft 1 bis 6+ vielflächige RPG-Würfel (d4, d6, d8, d10, d12, d20, d100) mit laufenden Summentotalen, Physik-Animationen und Verlauf.',
    'color-picker': 'Leichter visueller Farbwähler mit sofortigem 1-Klick-Kopieren für HEX, RGB, HSL und CMYK-Codes, kuratierte Paletten und WCAG-Kontrastprüfung.',
    'stopwatch': 'Aufwärtszählende Stoppuhr mit Millisekunden-Genauigkeit, Rundenaufzeichnung und schnellstem/langsamstem Rundenvergleich.',
    'metronome': 'Einstellbares Metronom von 40 bis 208 BPM mit visuellem Beat-Indikator, Tap-Tempo, Taktarten (4/4, 3/4, 6/8) und Lautstärkeregelung.',
    'chess-timer': 'Zwei-Spieler-Schachuhr mit Blitz-, Schnell- und benutzerdefinierten Zeitkontrollen. Auf Felder tippen zum Wechseln der Uhr.',
    'talking-clock': 'Uhr, die die aktuelle Uhrzeit laut vorliest, mithilfe der eingebauten Text-to-Speech-Funktion des Browsers. Automatische Ansagen einstellbar.',
    'bomb-countdown': 'Spielerischer Countdown mit Zündschnur-Animation, spannungssteigernden Farbwechseln und Explosionsanimation bei Null.',
    'custom-timer': 'Erstellen Sie einen benutzerdefinierten Countdown mit eigenem Namen, Themenfarbe, Endton und Dauer. Konfiguration speichern.',
    'split-timer': 'Stoppuhr mit Runden-Taste, die Teilzeiten mit Delta zur vorherigen Runde aufzeichnet. Schnellste/Langsamste-Abzeichen und Clipboard-Export.',
  }
};

// Generate translated title per language/tool
function getTitle(lang, tool) {
  const map = { es: 'es_title', fr: 'fr_title', de: 'de_title' };
  return tool[map[lang]] || tool.en_title;
}

// SEO description
function getDesc(lang, slug) {
  return TOOL_DESCS[lang][slug] || '';
}

// Generate a translated tool page
function generateToolPage(lang, tool) {
  const langTitle = getTitle(lang, tool);
  const desc = getDesc(lang, tool.slug);
  const enUrl = `https://classpanel.online/tools/${tool.slug}/`;
  const langUrl = `https://classpanel.online/${lang}/tools/${tool.slug}/`;
  const langName = LANG_NAMES[lang];
  const langFlag = LANG_FLAGS[lang];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/icon.svg">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <title>${langTitle} — ClassPanel.online</title>
  <meta name="description" content="${desc}">
  <!-- Canonical always points to the English original -->
  <link rel="canonical" href="${enUrl}">
  <link rel="alternate" hreflang="x-default" href="${enUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="es" href="https://classpanel.online/es/tools/${tool.slug}/">
  <link rel="alternate" hreflang="fr" href="https://classpanel.online/fr/tools/${tool.slug}/">
  <link rel="alternate" hreflang="de" href="https://classpanel.online/de/tools/${tool.slug}/">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/css/main.css?v=31">
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ClassPanel">
  <meta property="og:title" content="${langTitle} — ClassPanel.online">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${langUrl}">
  <meta property="og:image" content="https://classpanel.online/og-image.png">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${langTitle} — ClassPanel.online">
  <meta name="twitter:image" content="https://classpanel.online/og-image.png">
  <!-- Google AdSense -->
  <meta name="google-adsense-account" content="ca-pub-1563010132282807">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1563010132282807" crossorigin="anonymous"><\/script>
  <script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","yk2i9d47t3");<\/script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YQYENQ2J88"><\/script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YQYENQ2J88');<\/script>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="/${lang}/" class="brand-logo" title="ClassPanel Home">
          <img src="/assets/icons/logo.png" alt="ClassPanel Logo" class="brand-icon">
          <span>Class<span style="color: var(--primary);">Panel</span></span>
        </a>
        <span style="color: var(--border-strong); font-size: 1.25rem;">/</span>
        <span style="font-weight: 700; color: var(--text-primary);">${langTitle}</span>
      </div>
      <div class="header-actions">
        <button class="action-btn action-btn-icon" data-action="toggle-theme" title="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>
    </div>
  </header>

  <main class="container tool-stage-wrapper">
    <div class="tool-stage" style="text-align: center; padding: 3rem 1.5rem;">
      <!-- Language page redirect notice -->
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${langFlag}</div>
        <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.75rem;">${langTitle}</h1>
        <p style="color: var(--text-secondary); font-size: 1.05rem; max-width: 560px; margin: 0 auto 1.5rem;">${desc}</p>
        <a href="${enUrl}" class="btn-giant btn-giant-primary" style="display: inline-flex; align-items: center; gap: 0.75rem; text-decoration: none; padding: 1rem 2rem; font-size: 1.15rem;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Launch ${tool.en_title}
        </a>
      </div>

      <!-- Language notice -->
      <div style="padding: 1rem 1.5rem; background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 500px; margin: 0 auto; font-size: 0.9rem; color: var(--text-secondary);">
        ${lang === 'es' ? '🌐 Esta herramienta está disponible en inglés. El selector de idioma en la barra de navegación te permite cambiar de idioma.' : ''}
        ${lang === 'fr' ? '🌐 Cet outil est disponible en anglais. Le sélecteur de langue dans la barre de navigation vous permet de changer de langue.' : ''}
        ${lang === 'de' ? '🌐 Dieses Werkzeug ist auf Englisch verfügbar. Mit dem Sprachwahlschalter in der Navigationsleiste können Sie die Sprache wechseln.' : ''}
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/${lang}/" class="brand-logo"><img src="/assets/icons/logo.png" alt="ClassPanel Logo" class="brand-icon"><span>Class<span style="color: var(--primary);">Panel</span></span></a>
        </div>
        <div class="footer-col"><h4>${lang === 'es' ? 'Herramientas' : lang === 'fr' ? 'Outils' : 'Werkzeuge'}</h4><ul>
          <li><a href="/${lang}/tools/classroom-timer/">${lang === 'es' ? 'Temporizador de Clase' : lang === 'fr' ? 'Minuterie de Classe' : 'Unterrichtstimer'}</a></li>
          <li><a href="/${lang}/tools/stopwatch/">${lang === 'es' ? 'Cronómetro' : lang === 'fr' ? 'Chronomètre' : 'Stoppuhr'}</a></li>
          <li><a href="/${lang}/tools/metronome/">${lang === 'es' ? 'Metrónomo' : lang === 'fr' ? 'Métronome' : 'Metronom'}</a></li>
        </ul></div>
        <div class="footer-col"><h4>${lang === 'es' ? 'Legal' : lang === 'fr' ? 'Légal' : 'Rechtliches'}</h4><ul>
          <li><a href="/about/">${lang === 'es' ? 'Acerca de' : lang === 'fr' ? 'À propos' : 'Über uns'}</a></li>
          <li><a href="/privacy/">${lang === 'es' ? 'Privacidad' : lang === 'fr' ? 'Confidentialité' : 'Datenschutz'}</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom"><div>© 2026 ClassPanel.online. ${lang === 'es' ? 'Para educadores de todo el mundo.' : lang === 'fr' ? 'Pour les éducateurs du monde entier.' : 'Für Pädagogen weltweit.'}</div></div>
    </div>
  </footer>

  <script src="/assets/i18n/en.js"><\/script>
  <script src="/assets/i18n/${lang}.js"><\/script>
  <script src="/assets/js/i18n.js"><\/script>
  <script src="/assets/js/common.js?v=31"><\/script>
  <script>
    // Auto-redirect to English tool page with lang switcher available
    // The i18n.js will inject the language switcher into the header
    // and record this language preference in localStorage
  <\/script>
</body>
</html>`;
}

// Generate a translated homepage
function generateHomePage(lang) {
  const langName = LANG_NAMES[lang];
  const langFlag = LANG_FLAGS[lang];
  const titles = {
    es: 'ClassPanel — Temporizadores y Herramientas Gratuitas en Línea',
    fr: 'ClassPanel — Minuteries et Outils Gratuits en Ligne',
    de: 'ClassPanel — Kostenlose Online-Timer und Werkzeuge'
  };
  const descs = {
    es: 'Herramientas web gratuitas para clases, estudio y decisiones cotidianas: temporizadores, metrónomo, rueda de nombres, dados y más.',
    fr: 'Outils web gratuits pour les cours, l\'étude et les décisions quotidiennes : minuteries, métronome, roue des prénoms, dés et plus encore.',
    de: 'Kostenlose Web-Tools für Unterricht, Studium und alltägliche Entscheidungen: Timer, Metronom, Namenrad, Würfel und mehr.'
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/icon.svg">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <title>${titles[lang]}</title>
  <meta name="description" content="${descs[lang]}">
  <link rel="canonical" href="https://classpanel.online/">
  <link rel="alternate" hreflang="x-default" href="https://classpanel.online/">
  <link rel="alternate" hreflang="en" href="https://classpanel.online/">
  <link rel="alternate" hreflang="es" href="https://classpanel.online/es/">
  <link rel="alternate" hreflang="fr" href="https://classpanel.online/fr/">
  <link rel="alternate" hreflang="de" href="https://classpanel.online/de/">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/css/main.css?v=31">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${titles[lang]}">
  <meta property="og:description" content="${descs[lang]}">
  <meta property="og:url" content="https://classpanel.online/${lang}/">
  <meta property="og:image" content="https://classpanel.online/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="google-adsense-account" content="ca-pub-1563010132282807">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1563010132282807" crossorigin="anonymous"><\/script>
  <script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","yk2i9d47t3");<\/script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YQYENQ2J88"><\/script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YQYENQ2J88');<\/script>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/${lang}/" class="brand-logo">
        <img src="/assets/icons/logo.png" alt="ClassPanel Logo" class="brand-icon">
        <span>Class<span style="color: var(--primary);">Panel</span></span>
        <span class="brand-badge">Hub</span>
      </a>
      <div class="header-actions">
        <a href="/blog/" class="action-btn" style="text-decoration:none;font-weight:600;font-size:0.88rem;padding:0.45rem 0.85rem;">Blog</a>
        <button class="action-btn action-btn-icon" data-action="toggle-theme" title="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>
    </div>
  </header>

  <main>
    <section style="padding: 3.5rem 0 2.5rem; text-align: center;">
      <div class="container" style="max-width: 920px;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${langFlag}</div>
        <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; letter-spacing: -0.03em; margin-bottom: 1rem;">${titles[lang]}</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); max-width: 680px; margin: 0 auto 2rem;">${descs[lang]}</p>
        <a href="/" class="btn-giant btn-giant-primary" style="display: inline-flex; align-items: center; gap: 0.75rem; text-decoration: none; font-size: 1.1rem; padding: 1rem 2rem;">
          ${lang === 'es' ? 'Ver Todas las Herramientas' : lang === 'fr' ? 'Voir Tous les Outils' : 'Alle Werkzeuge Anzeigen'}
          →
        </a>
      </div>
    </section>

    <section style="padding: 2rem 0 4rem;">
      <div class="container">
        <div class="tools-grid">
${TOOLS.map(tool => `          <a href="/${lang}/tools/${tool.slug}/" class="tool-card" data-category="${tool.category}">
            <div class="tool-card-icon"><img src="/assets/icons/${tool.slug}.png" alt="${getTitle(lang, tool)}" onerror="this.src='/assets/icons/classroom-timer.png'"></div>
            <h2 class="tool-card-title">${getTitle(lang, tool)}</h2>
            <p class="tool-card-desc">${getDesc(lang, tool.slug)}</p>
            <div class="tool-card-meta">
              <span>${lang === 'es' ? 'Abrir herramienta →' : lang === 'fr' ? "Lancer l'outil →" : 'Werkzeug starten →'}</span>
            </div>
          </a>`).join('\n')}
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/${lang}/" class="brand-logo"><img src="/assets/icons/logo.png" alt="ClassPanel Logo" class="brand-icon"><span>Class<span style="color: var(--primary);">Panel</span></span></a>
          <p>${lang === 'es' ? 'Herramientas gratuitas de privacidad amigable para aulas, estudio y vida cotidiana.' : lang === 'fr' ? 'Outils gratuits respectueux de la vie privée pour les salles de classe, les études et la vie quotidienne.' : 'Kostenlose, datenschutzfreundliche Werkzeuge für Klassenzimmer, Studium und den Alltag.'}</p>
        </div>
        <div class="footer-col"><h4>${lang === 'es' ? 'Herramientas' : lang === 'fr' ? 'Outils' : 'Werkzeuge'}</h4><ul>
          <li><a href="/${lang}/tools/classroom-timer/">${lang === 'es' ? 'Temporizador de Clase' : lang === 'fr' ? 'Minuterie de Classe' : 'Unterrichtstimer'}</a></li>
          <li><a href="/${lang}/tools/metronome/">${lang === 'es' ? 'Metrónomo' : lang === 'fr' ? 'Métronome' : 'Metronom'}</a></li>
          <li><a href="/${lang}/tools/chess-timer/">${lang === 'es' ? 'Reloj de Ajedrez' : lang === 'fr' ? "Horloge d'Échecs" : 'Schachuhr'}</a></li>
        </ul></div>
        <div class="footer-col"><h4>${lang === 'es' ? 'Legal' : lang === 'fr' ? 'Légal' : 'Rechtliches'}</h4><ul>
          <li><a href="/about/">${lang === 'es' ? 'Acerca de' : lang === 'fr' ? 'À propos' : 'Über uns'}</a></li>
          <li><a href="/privacy/">${lang === 'es' ? 'Privacidad' : lang === 'fr' ? 'Confidentialité' : 'Datenschutz'}</a></li>
          <li><a href="/contact/">${lang === 'es' ? 'Contacto' : lang === 'fr' ? 'Contact' : 'Kontakt'}</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom"><div>© 2026 ClassPanel.online. ${lang === 'es' ? 'Para educadores de todo el mundo. Sin rastreo.' : lang === 'fr' ? 'Pour les éducateurs du monde entier. Zéro tracking.' : 'Für Pädagogen weltweit. Ohne Tracking.'}</div></div>
    </div>
  </footer>

  <script src="/assets/i18n/en.js"><\/script>
  <script src="/assets/i18n/${lang}.js"><\/script>
  <script src="/assets/js/i18n.js"><\/script>
  <script src="/assets/js/common.js?v=31"><\/script>
</body>
</html>`;
}

// Create directories and write files
let filesCreated = 0;

for (const lang of LANGUAGES) {
  // Homepage
  const homeDir = path.join(ROOT, lang);
  fs.mkdirSync(homeDir, { recursive: true });
  fs.writeFileSync(path.join(homeDir, 'index.html'), generateHomePage(lang), 'utf8');
  filesCreated++;
  console.log(`Created /${lang}/index.html`);

  // Tool pages
  for (const tool of TOOLS) {
    const toolDir = path.join(ROOT, lang, 'tools', tool.slug);
    fs.mkdirSync(toolDir, { recursive: true });
    fs.writeFileSync(path.join(toolDir, 'index.html'), generateToolPage(lang, tool), 'utf8');
    filesCreated++;
    console.log(`Created /${lang}/tools/${tool.slug}/index.html`);
  }
}

console.log(`\n✅ Done! Created ${filesCreated} translated pages.`);
