# Spec Delta

## ADDED Requirements

### Requirement: Dashboard charts display accurate per-entry and per-month labels

The web dashboard's **Transaction Flow**, **By Type**, and **12-Month Trend** charts SHALL render accurate, non-static tooltip headers and disambiguated X-axis labels rather than repeating a single static series label or colliding identical same-day dates.

#### Scenario: By Type tooltip displays the entry label instead of a static header
- **WHEN** a user hovers or focuses any bar in the **By Type** chart
- **THEN** the tooltip header identifies that transaction's date/time or customer rather than displaying the static string `"Transactions"`

#### Scenario: Multiple transactions on the same day remain distinguishable
- **WHEN** two or more of the last five transactions occurred on the same calendar day
- **THEN** their X-axis labels and tooltips distinguish each entry rather than collapsing them onto an identical date label

#### Scenario: 12-Month Trend tooltip displays the formatted month name
- **WHEN** a user hovers or focuses a bar in the **12-Month Trend** chart
- **THEN** the tooltip header displays the formatted month (for example, `"Nov 26"`) rather than `"12-Month Activity"`

### Requirement: Dashboard flow charts preserve direction and type classification

The web dashboard's **Transaction Flow** and **By Type** charts SHALL classify debit entries as payments received regardless of whether an optional payment method was recorded, and SHALL preserve negative signs on signed axis ticks and tooltips.

#### Scenario: Debit without a payment method is styled as payment received
- **WHEN** a debit transaction is recorded with no payment method (`None`)
- **THEN** the **By Type** chart renders it with the payment-received visual style and label rather than the credit-given style

#### Scenario: Negative payment ticks retain their minus sign
- **WHEN** the **Transaction Flow** or **By Type** chart renders negative values below zero on the Y-axis
- **THEN** the Y-axis tick labels display the negative sign (for example, `−₹500`) instead of an unsigned magnitude
