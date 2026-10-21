# Exch

Exch is a tool that tells a traveller, at a glance, which of two exchange quotes gives more money for the same trade, even when the quotes are written in opposite directions. It also converts a shop price to the home currency.

## Language

**Quote**:
One offer to exchange money, written as two amounts in two currencies (for example MYR 1000 ↔ JPY 38,721). The user copies it as it is shown at the source, in any direction.
_Avoid_: Rate, offer, deal

**Direction**:
The trade the user wants to make: the currency they give (**Give Currency**) and the currency they want (**Want Currency**). One Direction applies to both Quotes.
_Avoid_: From/to, buy/sell, base/quote currency

**Effective Rate**:
How much Want Currency a Quote gives for 1 unit of Give Currency. Every Quote is turned into an Effective Rate before comparison, whichever direction it was written in.
_Avoid_: Exchange rate, inverse rate, buy rate, sell rate

**Difference**:
How much more Want Currency the Better Quote gives for the Sample Amount, shown as an amount and a percentage.
_Avoid_: Savings, spread, margin

**Sample Amount**:
The amount of Give Currency used to show the Difference. It is the Give amount the user typed in the first Quote.
_Avoid_: Base amount

**Exchange Amount**:
The total amount of Give Currency the user plans to exchange. Each Quote's Effective Rate is applied to it to show the full Difference in Want Currency.
_Avoid_: Total, budget

**Home Currency**:
The currency the user thinks in, used to show what a Price costs them (for example MYR). It is always the Give Currency of the Direction.
_Avoid_: Local currency, base currency

**Foreign Currency**:
The currency a Price is written in while shopping abroad (for example JPY). It is always the Want Currency of the Direction.
_Avoid_: Target currency, local currency

**Price**:
An amount in Foreign Currency the user sees on an item.
_Avoid_: Cost, amount

**Home Cost**:
What a Price costs in Home Currency at the chosen rate.
_Avoid_: Converted price, local price

**Rate Source**:
Where the price converter takes its rate from: Quote 1, Quote 2, a Single Rate, or an Amount Pair.
_Avoid_: Rate mode, rate option

**Single Rate**:
A rate the user types on the price converter as one number: 1 unit of one currency equals that many units of the other (for example MYR 1 = JPY 38.72, or JPY 1 = MYR 0.0258).
_Avoid_: Custom rate, manual rate

**Amount Pair**:
A rate the user types on the price converter as two amounts, written like a Quote in any direction (for example JPY 1000 = MYR 25.83).
_Avoid_: Custom rate, manual rate, override

**Better Quote**:
The Quote that gives the user more of the currency they want for the same amount of the currency they give.
_Avoid_: Best rate, cheaper rate
