# Exch

![Exch icon](icon-192.png)

Exch is a small web app with two pages. You can install it on your phone or computer, and it works offline.

- **Compare** (`index.html`): compares two currency exchange quotes and tells you which one gives you more money.
- **Convert** (`convert.html`): shows what a price in a foreign currency costs in your home currency, while you shop.

## The problem

Exchange quotes are often written in opposite directions:

- Wise shows: **MYR 1,000 → JPY 38,721**
- A money changer shows: **JPY 1,000 = MYR 25.83**

You cannot compare these numbers by looking at them. This app converts both quotes to the same unit (how much JPY you get for 1 MYR) and shows the better one.

## Features

- Compares two quotes for any pair of currencies. Each currency field is a dropdown of 22 common travel currencies. You can type a code or a name to filter the list, or type any other 3-letter code and tap **Use this code**.
- You type each quote exactly as you see it, in any direction.
- Shows the rate of each quote, the better quote, and the difference in money and percent.
- Shows the total you get from each quote for the amount you plan to exchange.
- Swap button to reverse the direction (for example, JPY back to MYR after a trip).
- Saves your values on your device, so you can check Wise first and type the store quote later.
- Installs as an app (PWA) and works offline. Uses no API and sends no data to a server.
- Converts a shop price to your home currency, using the rate from Quote 1, Quote 2, or a rate you type.
- Dark theme. Works on phone and desktop.

## How to use

1. Set **I give** and **I want** (default: MYR → JPY).
2. In **Quote 1**, type the first quote. Example: MYR `1000` = JPY `38721`.
3. In **Quote 2**, type the second quote as the store shows it. Example: JPY `1000` = MYR `25.83`.
4. If a quote uses the opposite order, tap a currency label to flip it.
5. Read the result. The better quote has a green border.
6. Optional: in **I plan to exchange**, type your total amount (for example MYR `6000`) to see how much more you get with the better quote.

Tap **Clear** to reset all values.

### Convert a price while shopping

1. Open **Convert** at the top of the page. It uses the currencies from the Compare page: **I give** is your home currency, and **I want** is the foreign currency.
2. In **Rate from**, choose the rate you actually exchanged at. At first, the page uses the better quote from the Compare page.
   - **Quote 1** or **Quote 2**: the rate from the Compare page.
   - **Rate**: type one number, for example MYR 1 = JPY `38.72`. Tap the currency to switch to JPY 1 = MYR ….
   - **Amounts**: type two amounts as you see them, for example JPY `1000` = MYR `25.83`.
4. Type the price, for example JPY `1500`. The page shows the cost in your home currency, for example **MYR 38.74**.

The page saves your rate choice. It does not save the price, so each item starts empty.

## Run

Open `index.html` in a browser. You do not need a build step, a server, or `npm install`.

When you open the file directly (`file://`), the app works, but you cannot install it and it does not work offline. The browser runs the service worker only on HTTPS or `localhost`.

To test install and offline on your computer, serve the folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To host it, upload the files to any static host with HTTPS, for example GitHub Pages or Netlify. All paths are relative, so the app works at a domain root or in a sub-folder.

## Install

- **Android (Chrome)**: open the menu (⋮) and tap **Install app** or **Add to Home screen**.
- **iPhone and iPad (Safari)**: tap **Share**, then **Add to Home Screen**.
- **Desktop (Chrome, Edge)**: click the install icon in the address bar.

The installed app opens the page you used last (Compare or Convert). On Android and desktop, long-press or right-click the icon to open Compare or Convert directly.

## Offline and updates

The service worker (`sw.js`) keeps every app file in a cache. After the first visit, the app opens with no network.

When you change any app file, change `CACHE` in `sw.js` (for example from `exch-v1` to `exch-v2`). If you do not, users keep the old files. When a user opens the app after you publish the change, the app shows **New version available**. A tap on **Reload** loads the new version. Saved values stay.

If you add a new file, also add it to `FILES` in `sw.js`.

## Icon

`tools/make-icons.py` draws the icon and writes `icon.svg`, the PNG icons, and `favicon.ico`. To change the icon, edit the shapes in the script and run it. You need Python 3 and Pillow.

```sh
python3 tools/make-icons.py
```

## Test

The comparison math has unit tests. You need Node.js 18 or later.

```sh
node --test
```

## Files

| File | Content |
| --- | --- |
| `index.html` | The Compare page |
| `convert.html` | The Convert page |
| `style.css` | The styles (dark theme, responsive layout) |
| `app.js` | The Compare page logic |
| `convert.js` | The Convert page logic |
| `shared.js` | Saved values and number formats used by both pages |
| `currency-picker.js` | The currency dropdown used by every currency field |
| `compare.js` | The rate and price math. It has no page code, so Node can test it. |
| `compare.test.js` | Unit tests for `compare.js` |
| `pwa.js` | Registers the service worker, shows the update bar, and saves the last page |
| `sw.js` | The service worker: the offline cache |
| `manifest.webmanifest` | The app name, icons, colors, and shortcuts for install |
| `icon.svg`, `icon-*.png`, `apple-touch-icon.png`, `favicon.ico` | The app icon |
| `tools/make-icons.py` | Makes the icon files |
| `CONTEXT.md` | Glossary of the terms the project uses |

## Limits

- The app does not get live rates. You type the rates yourself.
- The app does not include fees that are not part of the quote (for example, a fixed transfer fee). To include a fee, type the final amount you receive.
