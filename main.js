// The download button points at the installer for the visitor's system, taken
// from the latest release; the page is in English or French.

const REPO = 'anderson3x11/cascades';

const FRENCH = {
  'nav.features': 'Fonctionnalités',
  'nav.plugins': 'Plugins',
  'nav.docs': 'Docs',
  'hero.title': 'Des notes qui',
  'hero.flow': 'coulent de source.',
  'hero.lead':
    'Un éditeur de texte léger pensé pour la prise de notes, qui reste capable d’ouvrir n’importe quel fichier texte ou code. La simplicité de Notepad++, la personnalisation de Vim, une interface moderne.',
  'hero.download': 'Télécharger',
  'hero.others': 'Autres systèmes',
  'hero.meta': 'Libre et gratuit · Windows, macOS, Linux',
  'hero.gif': 'Une note tapée au clavier : chaque ligne indentée reçoit son lien',
  'cascades.title': 'Indentez, les idées se relient',
  'cascades.text':
    'Appuyez sur Tab quand une ligne découle de celle du dessus : Cascades dessine le lien. Le fichier ne contient que des tabulations, les traits sont dessinés, jamais écrits : vos notes restent du texte simple, lisible partout.',
  'f1.title': 'Fait pour écrire',
  'f1.text':
    'Listes intelligentes, paires automatiques, outils de casse et de lignes, correcteur orthographique, signets, et les lignes modifiées depuis le dernier enregistrement marquées dans la marge.',
  'f2.title': 'Toutes vos notes sous la main',
  'f2.text':
    'Les dossiers à gauche, l’ouverture rapide avec Ctrl+P, la recherche et le remplacement dans tous les fichiers. Des onglets, des vues côte à côte, et une session qui revient comme vous l’avez laissée, notes non enregistrées comprises.',
  'f3.title': 'Voir le rendu',
  'f3.text':
    'Aperçus Markdown, HTML, CSV et JSON à côté du texte. Les images et les PDF s’ouvrent dans un onglet.',
  'f4.title': 'Rien que le texte',
  'f4.text':
    'Le mode zen cache tout sauf vos mots. Sept thèmes, clairs et sombres, et les vôtres.',
  'f5.title': 'À votre façon',
  'f5.text':
    'Chaque réglage et chaque raccourci dans une seule fenêtre, ou dans settings.json. Une touche leader pour plus de raccourcis, et tout est une commande.',
  'plugins.title': 'Plugins',
  'plugins.text':
    'Un plugin est un dossier avec un manifeste et un fichier JavaScript. Il reçoit la même API que les fonctionnalités de Cascades : commandes, raccourcis, menus, panneaux, éditeur.',
  'plugins.link': 'Écrire un plugin',
  'footer.license': 'Cascades est un logiciel libre sous licence MIT.',
  'footer.source': 'Code source',
  'footer.issue': 'Signaler un bug',
  theme: 'Changer de thème',
  'download.windows': 'Télécharger pour Windows',
  'download.macos': 'Télécharger pour macOS',
  'download.linux': 'Télécharger pour Linux (AppImage)',
  version: 'Version {version} · Libre et gratuit · Windows, macOS, Linux',
};

const ENGLISH = {
  theme: 'Switch theme',
  'download.windows': 'Download for Windows',
  'download.macos': 'Download for macOS',
  'download.linux': 'Download for Linux (AppImage)',
  version: 'Version {version} · Free and open source · Windows, macOS, Linux',
};

// English texts come from the page itself.
for (const element of document.querySelectorAll('[data-i18n]')) {
  ENGLISH[element.dataset.i18n] ??= element.textContent.trim().replace(/\s+/g, ' ');
}
for (const element of document.querySelectorAll('[data-i18n-alt]')) {
  ENGLISH[element.dataset.i18nAlt] ??= element.alt;
}

let language = 'en';
try {
  language = localStorage.getItem('language') ?? '';
} catch {
  // Private window: follow the browser.
}
if (language !== 'en' && language !== 'fr') {
  language = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

let release = null;
const text = (key, params = {}) =>
  ((language === 'fr' ? FRENCH : ENGLISH)[key] ?? ENGLISH[key] ?? key).replace(
    /\{(\w+)\}/g,
    (_, name) => params[name] ?? '',
  );

function system() {
  const agent = navigator.userAgent;
  if (/Windows/.test(agent)) return 'windows';
  if (/Macintosh|Mac OS X/.test(agent)) return 'macos';
  if (/Linux|X11/.test(agent) && !/Android/.test(agent)) return 'linux';
  return null;
}

const INSTALLERS = {
  windows: /x64-setup\.exe$/,
  macos: /universal\.dmg$/,
  linux: /\.AppImage$/,
};

function render() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = text(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll('[data-i18n-alt]')) {
    element.alt = text(element.dataset.i18nAlt);
  }
  const button = document.getElementById('language');
  button.textContent = language === 'fr' ? 'EN' : 'FR';
  button.setAttribute('aria-label', language === 'fr' ? 'English' : 'Français');
  document.getElementById('theme').setAttribute('aria-label', text('theme'));

  const os = system();
  const asset = os && release?.assets.find((a) => INSTALLERS[os].test(a.name));
  const download = document.getElementById('download');
  if (asset) {
    download.href = asset.browser_download_url;
    download.querySelector('span').textContent = text(`download.${os}`);
  }
  if (release) {
    document.getElementById('version').textContent = text('version', {
      version: release.tag_name.replace(/^v/, ''),
    });
  }
}

// The theme button switches between light and dark; the choice is kept.
document.getElementById('theme').addEventListener('click', () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('theme', root.dataset.theme);
  } catch {
    // Not remembered, still switched.
  }
});

document.getElementById('language').addEventListener('click', () => {
  language = language === 'fr' ? 'en' : 'fr';
  try {
    localStorage.setItem('language', language);
  } catch {
    // Not remembered, still switched.
  }
  render();
});

render();

// Without the API (offline, rate limit), the button keeps its link to the releases page.
fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
  .then((response) => (response.ok ? response.json() : null))
  .then((latest) => {
    release = latest;
    render();
  })
  .catch(() => {});

// A screenshot opens full size on click (or Enter); a click or Escape closes it.
const zoom = document.createElement('dialog');
zoom.className = 'zoom';
zoom.innerHTML = '<img alt="" />';
document.body.append(zoom);
zoom.addEventListener('click', () => zoom.close());

for (const image of document.querySelectorAll('img[data-zoom]')) {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  const open = () => {
    zoom.firstChild.src = image.currentSrc || image.src;
    zoom.firstChild.alt = image.alt;
    zoom.showModal();
  };
  image.addEventListener('click', open);
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });
}

// Blocks fade in as they scroll into view.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        reveal.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
for (const element of document.querySelectorAll('.reveal')) reveal.observe(element);
