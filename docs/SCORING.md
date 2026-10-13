# Scoring Model

## Task score
completionRatio = actualFocused / target
basePoints = priority × min(completionRatio, 1)
bonusEffort = max(actual − target, 0)  (stored separately, not scored)

## Daily score
Sum of basePoints across active tasks. Max = sum of active priorities (55 for priorities 1–10).
Separate subtotals: Career, Lifestyle, Fitness.

## Consistency
% of active days with daily score ≥ minimum viable day (default 30/55, configurable).

## Trend
7-day and 30-day average score; % change vs previous period. Streaks are secondary.

## Reality check
Planned vs actual focused hours, applications, DSA hours per 7/30-day period.

## Required unit tests
- P10, target 2h, actual 1h → 5
- P10, target 2h, actual 6h → 10 (not 30)
- P10, target 1.5h, actual 1h → 6.67
- actual 0 → 0; target 0 handled safely; negative input rejected
- Bonus does not change base score
- Consistency and date-boundary calculations
