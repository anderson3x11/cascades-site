// The reference comes from the app repository (docs/reference.json, written by
// npm run docs), taken at the tag of the latest release so that it matches the
// version people download.

const REPO = 'anderson3x11/cascades';

const FRENCH = {
  'nav.features': 'Fonctionnalités',
  'nav.docs': 'Docs',
  'docs.title': 'Documentation',
  'docs.lead': 'Raccourcis, commandes et réglages, comme dans l’application.',
  'leader.title': 'La touche leader',
  'leader.text':
    '« Leader S » veut dire : appuyer sur Ctrl+Espace, relâcher, puis appuyer sur S. Une barre en bas de la fenêtre affiche les touches possibles. La touche leader est le réglage keyboard.leader.',
  'config.title': 'Votre configuration',
  'config.text':
    'Les Préférences (Ctrl+,) changent chaque réglage et chaque raccourci. Ils sont écrits dans settings.json et keybindings.json, dans le dossier de config : %APPDATA%\\dev.cascades.app sous Windows, ~/Library/Application Support/dev.cascades.app sous macOS, ~/.config/dev.cascades.app sous Linux.',
  'plugins.title': 'Plugins',
  'plugins.text': 'Ajoutez vos propres commandes, panneaux et plus encore.',
  'plugins.link': 'Écrire un plugin',
  search: 'Rechercher',
  'system.pc': 'Windows et Linux',
  'shortcuts.title': 'Commandes et raccourcis',
  'settings.title': 'Réglages',
  loading: 'Chargement…',
  'footer.license': 'Cascades est un logiciel libre sous licence MIT.',
  'footer.source': 'Code source',
  'footer.issue': 'Signaler un bug',
  version: 'Version {version}. Raccourcis, commandes et réglages, comme dans l’application.',
  default: 'Par défaut',
  values: 'Valeurs',
  nothing: 'Rien ne correspond.',
  unavailable: 'La documentation n’a pas pu être chargée.',
  other: 'Autres',
};

const ENGLISH = {
  version: 'Version {version}. Shortcuts, commands and settings, as in the app.',
  default: 'Default',
  values: 'Values',
  nothing: 'Nothing matches.',
  unavailable: 'The documentation could not be loaded.',
  other: 'Other',
};

for (const element of document.querySelectorAll('[data-i18n]')) {
  ENGLISH[element.dataset.i18n] ??= element.textContent.trim().replace(/\s+/g, ' ');
}
for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
  ENGLISH[element.dataset.i18nPlaceholder] ??= element.placeholder;
}

const stored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered.
  }
};

let language = stored('language');
if (language !== 'en' && language !== 'fr') {
  language = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
let system = /Macintosh|Mac OS X/.test(navigator.userAgent) ? 'mac' : 'pc';
let reference = null;
let failed = false;

const text = (key, params = {}) =>
  ((language === 'fr' ? FRENCH : ENGLISH)[key] ?? ENGLISH[key] ?? key).replace(
    /\{(\w+)\}/g,
    (_, name) => params[name] ?? '',
  );

/** Lower case without accents, for searching. */
const fold = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function renderCommands(data, words) {
  const box = document.getElementById('commands');
  const groups = new Map();
  for (const command of data.commands) {
    const keys = system === 'mac' ? command.keysMac : command.keys;
    const haystack = fold(`${command.title} ${command.category} ${command.id} ${keys.join(' ')}`);
    if (!words.every((word) => haystack.includes(word))) continue;
    const category = command.category || text('other');
    groups.set(category, [...(groups.get(category) ?? []), { ...command, keys }]);
  }
  const children = [];
  for (const [category, commands] of groups) {
    children.push(element('h3', null, category));
    const list = element('dl');
    for (const command of commands) {
      const row = element('div', 'row');
      const name = element('dt');
      name.append(element('span', null, command.title), element('code', null, command.id));
      const keys = element('dd');
      for (const key of command.keys) keys.append(element('kbd', null, key));
      row.append(name, keys);
      list.append(row);
    }
    children.push(list);
  }
  box.replaceChildren(...(children.length ? children : [element('p', 'empty', text('nothing'))]));
}

function renderSettings(data, words) {
  const box = document.getElementById('settings-list');
  const groups = new Map();
  for (const setting of data.settings) {
    const haystack = fold(`${setting.key} ${setting.description}`);
    if (!words.every((word) => haystack.includes(word))) continue;
    const section = setting.key.slice(0, setting.key.indexOf('.'));
    groups.set(section, [...(groups.get(section) ?? []), setting]);
  }
  const children = [];
  for (const [section, settings] of groups) {
    children.push(element('h3', null, section));
    const list = element('dl');
    for (const setting of settings) {
      const row = element('div', 'row setting');
      const name = element('dt');
      name.append(element('code', null, setting.key), element('span', null, setting.description));
      const details = element('dd');
      details.append(element('small', null, `${text('default')}: ${JSON.stringify(setting.default)}`));
      if (setting.values) {
        details.append(
          element('small', null, `${text('values')}: ${setting.values.map((v) => JSON.stringify(v)).join(', ')}`),
        );
      }
      row.append(name, details);
      list.append(row);
    }
    children.push(list);
  }
  box.replaceChildren(...(children.length ? children : [element('p', 'empty', text('nothing'))]));
}

function render() {
  document.documentElement.lang = language;
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = text(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = text(node.dataset.i18nPlaceholder);
  }
  const button = document.getElementById('language');
  button.textContent = language === 'fr' ? 'EN' : 'FR';
  button.setAttribute('aria-label', language === 'fr' ? 'English' : 'Français');
  for (const choice of document.querySelectorAll('[data-system]')) {
    choice.setAttribute('aria-pressed', String(choice.dataset.system === system));
  }

  if (failed) {
    document.getElementById('commands').replaceChildren(element('p', 'empty', text('unavailable')));
    return;
  }
  if (!reference) return;
  document.getElementById('version').textContent = text('version', { version: reference.version });
  const words = fold(document.getElementById('search').value).split(/\s+/).filter(Boolean);
  const data = reference[language] ?? reference.en;
  renderCommands(data, words);
  renderSettings(data, words);
}

document.getElementById('language').addEventListener('click', () => {
  language = language === 'fr' ? 'en' : 'fr';
  store('language', language);
  render();
});
for (const choice of document.querySelectorAll('[data-system]')) {
  choice.addEventListener('click', () => {
    system = choice.dataset.system;
    render();
  });
}
document.getElementById('search').addEventListener('input', render);

render();

async function load() {
  const raw = (ref) => `https://raw.githubusercontent.com/${REPO}/${ref}/docs/reference.json`;
  let tag = null;
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (response.ok) tag = (await response.json()).tag_name;
  } catch {
    // Without the API, the reference of the main branch.
  }
  for (const ref of [tag, 'main'].filter(Boolean)) {
    const response = await fetch(raw(ref)).catch(() => null);
    if (response?.ok) return await response.json();
  }
  throw new Error('no reference');
}

load()
  .then((data) => {
    reference = data;
    render();
  })
  .catch(() => {
    failed = true;
    render();
  });
