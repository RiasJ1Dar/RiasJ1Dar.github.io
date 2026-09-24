# Портфоліо RiasJiDar

Статичний сайт-портфоліо українською у стилі Windows 95 / retro OS.

**Жива версія:** [riasj1dar.github.io](https://riasj1dar.github.io/)

## Що є на сайті

Поточна головна сторінка — **Win95 Deck**. Вона поводиться як невеликий
desktop:

- вікна README, Manifesto, Explorer, System Monitor, FAQ і Terminal;
- відкриття, фокус, згортання та закриття вікон;
- адаптивне розміщення на вузьких екранах;
- Explorer із живим списком публічних репозиторіїв;
- останній GitHub Release для проєктів, де він є;
- статичний fallback, якщо GitHub API недоступний або вичерпано rate limit;
- інтерактивний термінал без виконання системних команд.

Explorer не показує сам сайт, профільний репозиторій і `.github`. Решту
публічних репозиторіїв сортує за датою останнього push.

## Термінал

Вбудований `signal.sh` підтримує лише локальні команди інтерфейсу:

```text
help
clear / cls
ls / dir
cat readme.txt
cat signal.toml
donate
whoami
neofetch
about
exit / quit
```

Введений текст не передається shell або серверу.

## Версії дизайну

| Шлях | Версія |
|---|---|
| [`/`](https://riasj1dar.github.io/) | Поточний Win95 Deck |
| [`/v1/`](https://riasj1dar.github.io/v1/) | Перша технічна вітрина з картками й схемами |
| [`/v2/`](https://riasj1dar.github.io/v2/) | Неоновий Signal Deck |
| `/v3/` | Redirect на поточну головну |

Архівні версії мають `noindex`, щоб канонічною сторінкою залишалася головна.

## Стек

- HTML, CSS і vanilla JavaScript;
- без bundler, framework і build step;
- GitHub REST API для Explorer та останніх releases;
- GitHub Pages для публікації.

Основний сайт не залежить від Google Fonts. Усі інтерактивні дії виконуються в
браузері.

## Локальний запуск

Через fetch і routing зручніше відкривати сайт через локальний HTTP-сервер:

```bash
git clone https://github.com/RiasJ1Dar/RiasJ1Dar.github.io.git
cd RiasJ1Dar.github.io
python -m http.server 8000
```

Відкрий [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

## Структура

```text
index.html      поточний Win95 Deck
style.css       desktop, вікна, responsive layout
app.js          window manager, Explorer, terminal
v1/             перший дизайн
v2/             Signal Deck
v3/             redirect на головну
robots.txt      правила для crawler-ів
```

## Оновлення проєктів

Живий Explorer підтягує репозиторії автоматично. Статичні рядки в
`index.html` потрібні як fallback, тому при великих змінах портфеля онови і
їх. Описи репозиторіїв у GitHub використовуються як основний текст у живому
списку.

## Ліцензія

MIT