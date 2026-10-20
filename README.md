# Which Rate Is Better?

A small web app that compares two currency exchange quotes and tells you which one gives you more money.

## The problem

Exchange quotes are often written in opposite directions:

- Wise shows: **MYR 1,000 → JPY 38,721**
- A money changer shows: **JPY 1,000 = MYR 25.83**

You cannot compare these numbers by looking at them. This app converts both quotes to the same unit (how much JPY you get for 1 MYR) and shows the better one.

## Features

- Compares two quotes for any pair of currencies.
- You type each quote exactly as you see it, in any direction.
- Shows the rate of each quote, the better quote, and the difference in money and percent.
- Shows the total you get from each quote for the amount you plan to exchange.
- Swap button to reverse the direction (for example, JPY back to MYR after a trip).
- Saves your values on your device, so you can check Wise first and type the store quote later.
- Works offline. Uses no API and sends no data to a server.
- Dark theme. Works on phone and desktop.

## How to use

1. Set **I give** and **I want** (default: MYR → JPY).
2. In **Quote 1**, type the first quote. Example: `1000` MYR = `38721` JPY.
3. In **Quote 2**, type the second quote as the store shows it. Example: `1000` JPY = `25.83` MYR.
4. If a quote uses the opposite order, tap a currency label to flip it.
5. Read the result. The better quote has a green border.
6. Optional: in **I plan to exchange**, type your total amount (for example `6000` MYR) to see how much more you get with the better quote.

Tap **Clear** to reset all values.

## Run

Open `index.html` in a browser. You do not need a build step, a server, or `npm install`.

To host it, upload the files to any static host, for example GitHub Pages or Netlify.

## Test

The comparison math has unit tests. You need Node.js 18 or later.

```sh
node --test
```

## Files

| File | Content |
| --- | --- |
| `index.html` | The page |
| `style.css` | The styles (dark theme, responsive layout) |
| `app.js` | The page logic and saving values on the device |
| `compare.js` | The comparison math. It has no page code, so Node can test it. |
| `compare.test.js` | Unit tests for `compare.js` |
| `CONTEXT.md` | Glossary of the terms the project uses |

## Limits

- The app does not get live rates. You type the rates yourself.
- The app does not include fees that are not part of the quote (for example, a fixed transfer fee). To include a fee, type the final amount you receive.
