**PERSONAL PROGRESS OS**

**Product Requirements + Technical Specification + Build Guide**

A personal operating system for measuring execution, career development, and fitness progress

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Core principle</strong></p>
<p>Measure the gap between what I intend to do and what I actually execute. Record focused work, attach evidence where useful, analyze trends, and use the results to adjust the plan.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Document status: Build-ready specification**

# Contents

- 1\. Product Overview

- 2\. Problem Statement

- 3\. Goals and Success Criteria

- 4\. Scope and Release Plan

- 5\. Product Principles

- 6\. Functional Requirements

- 7\. Daily Tracking and Scoring Model

- 8\. Goal and Skill System

- 9\. Career / Job Pipeline

- 10\. Gym and Fitness Module

- 11\. Analytics and Reviews

- 12\. Data Model

- 13\. Technical Architecture

- 14\. Technology Stack

- 15\. Application Structure

- 16\. UX Requirements

- 17\. Security and Privacy

- 18\. Testing Strategy

- 19\. Development Roadmap

- 20\. Definition of Done

- 21\. Future Enhancements

- 22\. Implementation Rules

# 1. Product Overview

Personal Progress OS is a personal full-stack web application that turns long-term outcomes into a measurable execution system. It is designed to be used every day, reviewed every week, and analyzed over 30-day and longer periods.

The application starts from the user's real-world goals, breaks them into skills and tasks, records focused effort and evidence, calculates weighted progress, and exposes trends. It also includes a separate career pipeline and a gym progress area so that professional development and physical development can be tracked in one system without mixing their scores.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>One-sentence product definition</strong></p>
<p>A personal analytics and execution control panel that measures goals, focused work, outputs, career pipeline, and fitness progress over time.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 2. Problem Statement

A binary habit tracker records whether a task was marked complete, but it cannot answer how much useful work happened, whether a partial session was meaningful, whether high-priority work received enough time, or whether the user's effort is producing measurable progress.

The application solves this by replacing simple checkboxes with quantitative entries and evidence. Time is recorded as focused work, not merely elapsed clock time. High-priority tasks carry more weight. Extra work is visible but cannot inflate the base daily score without limit. Career applications are tracked as a funnel rather than as a raw count.

# 3. Goals and Success Criteria

## 3.1 Product goals

- Provide a fast daily logging workflow that can be completed in roughly five minutes.

- Measure focused execution rather than intention.

- Connect long-term outcomes to the skills and tasks needed to pursue them.

- Show trends over 7-day, 30-day, and longer periods.

- Track job-search activity from application through assessment and interview stages.

- Track gym sessions, exercise performance, body measurements, and optional progress photos.

- Keep career, lifestyle, and fitness data analytically distinct while presenting them in one dashboard.

## 3.2 Success criteria

| **Area**      | **Success condition**                                                 |
|---------------|-----------------------------------------------------------------------|
| Daily logging | User can log a day in under five minutes.                             |
| Scoring       | Scoring is deterministic, capped, and covered by automated tests.     |
| Career        | Applications and status changes can be recorded without spreadsheets. |
| Fitness       | Workout and strength progress can be logged and graphed.              |
| Analytics     | User can compare planned vs actual focused hours and outputs.         |
| Security      | Authenticated users can access only their own private data.           |
| Deployment    | Application runs in production with persistent database storage.      |

# 4. Scope and Release Plan

## 4.1 MVP

- Authentication

- Goals

- Tasks and priorities

- Daily focused-hour logging

- Output/evidence fields

- Weighted score engine

- Dashboard

- 7/30-day analytics

- Basic settings

## 4.2 Release 2

- Job application tracker

- Application status history

- Interview tracking

- Hiring funnel analytics

- Skill roadmap and milestones

- Weekly review and monthly review

## 4.3 Release 3

- Workout logging

- Exercise library

- Sets / reps / weight

- Strength trends

- Body measurements

- Private progress-photo storage

## 4.4 Later releases

- Nutrition tracking

- PWA/mobile optimization

- Automated reports

- Advanced goal templates

- Multi-user SaaS architecture

- Optional AI-assisted planning

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Scope discipline</strong></p>
<p>Do not build the future releases before the MVP is actually used for daily logging. The product is only valuable when it changes real behavior and produces trustworthy historical data.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 5. Product Principles

- No credit for intention: only recorded execution counts.

- Focused time is preferred over elapsed time.

- Output should validate hours for career/technical work.

- Priority determines importance, but overwork cannot create unlimited base points.

- A missed day remains a missed day; extra work later does not erase it.

- Career and fitness scores remain separate.

- Long-term trends matter more than a single good or bad day.

- The system should expose discrepancies without judging the user.

# 6. Functional Requirements

## 6.1 Authentication

- Email/password authentication in MVP.

- Session persistence.

- Protected application routes.

- Logout.

- Future support for Google/GitHub OAuth.

## 6.2 Task management

| **Field**     | **Requirement**                            |
|---------------|--------------------------------------------|
| Task name     | Required, human-readable.                  |
| Category      | Career, Lifestyle, Fitness, or custom.     |
| Priority      | Integer 1-10.                              |
| Daily target  | Numeric target with a unit.                |
| Tracking type | Time, count, boolean, or measurement.      |
| Goal link     | Optional relationship to a goal/skill.     |
| Active dates  | Task can be enabled/disabled for a period. |
| Notes         | Optional description or instructions.      |

## 6.3 Daily entry

- Select date.

- Enter actual focused hours or other measured value.

- Add output/evidence where applicable.

- Save and recalculate the daily score.

- Allow edits while maintaining an audit record.

# 7. Daily Tracking and Scoring Model

The proposed priority system uses task weights from 1 to 10. If every priority from 1 through 10 is active, the maximum base score is 55 because 1 + 2 + ... + 10 = 55.

## 7.1 Time-based scoring

> Completion Ratio = Actual Focused Hours / Target Hours  
> Base Points = Priority × min(Completion Ratio, 1)

| **Priority** | **Target** | **Actual** | **Base points** |
|--------------|------------|------------|-----------------|
| 10           | 1.5 h      | 0 h        | 0.00            |
| 10           | 1.5 h      | 0.75 h     | 5.00            |
| 10           | 1.5 h      | 1.00 h     | 6.67            |
| 10           | 1.5 h      | 1.50 h     | 10.00           |
| 10           | 1.5 h      | 2.50 h     | 10.00 (capped)  |

## 7.2 Focused time definition

Focused time is the amount of time intentionally spent doing the task, excluding unrelated phone use, browsing, meals, conversations, and other non-task activity. The MVP may use manual entry; a timer can be added later.

## 7.3 Bonus work

Actual time above the target may be stored as bonus effort, but it does not increase the base score beyond the task priority. This prevents one extreme day from mathematically compensating for several zero days.

## 7.4 Anti-gaming rules

- Career/technical tasks should support an evidence/output field.

- Retroactive edits must be recorded in an audit log.

- Base points are capped at the task priority.

- Streaks are secondary metrics, not the primary measure.

- The application should show planned vs actual effort side by side.

## 7.5 Career vs lifestyle scoring

The dashboard should display multiple scoreboards so that lifestyle activity cannot hide weak career execution. Recommended views: Overall Progress, Career Score, Lifestyle Score, and Fitness Progress. Gym or reading time should not directly increase the Career Score.

# 8. Goal and Skill System

## 8.1 Goal entity

| **Field**        | **Example**                                                             |
|------------------|-------------------------------------------------------------------------|
| Goal             | Secure an entry-level job at or above the chosen compensation threshold |
| Start date       | 2026-09-30                                                              |
| Target date      | 2026-10-31                                                              |
| Priority         | High                                                                    |
| Status           | Active                                                                  |
| Success criteria | Offer received and accepted                                             |
| Notes            | Personal outcome goal; not guaranteed by the system                     |

## 8.2 Goal-to-skill mapping

A goal should reference the skills required to pursue it. Example software-engineering skill areas include DSA, JavaScript, React, backend development, SQL, DBMS, OOP, Git, projects, and interview communication.

Skills should contain milestones rather than pretending to represent objective employability percentages.

> Goal  
> └── Skills  
> └── Milestones  
> └── Tasks / Evidence

# 9. Career / Job Pipeline

The job-search component is a small application-tracking CRM. Its purpose is to record the funnel, not merely the number of applications.

| **Field**      | **Description**                                                         |
|----------------|-------------------------------------------------------------------------|
| Company        | Employer name                                                           |
| Job title      | Role applied for                                                        |
| Location       | City / remote / hybrid                                                  |
| Compensation   | Published or known range                                                |
| Source         | LinkedIn, company site, referral, portal, etc.                          |
| Applied date   | Date submitted                                                          |
| Resume version | Version used for the application                                        |
| Status         | Saved / Applied / Assessment / Interview / Rejected / Offer / Withdrawn |
| Referral       | Person or referral status                                               |
| Notes          | Free-form context                                                       |

## 9.1 Status pipeline

> Saved → Applied → Response → Assessment → Interview 1 → Interview 2 → HR → Offer  
> └────────────────────────→ Rejected

## 9.2 Funnel analytics

- Applications submitted

- Responses

- Assessments

- Interviews

- Offers

- Application-to-response rate

- Response-to-assessment rate

- Assessment-to-interview rate

- Interview-to-offer rate

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Interpretation rule</strong></p>
<p>The application should show these measurements but should not infer causation or guarantee an outcome from small samples.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 10. Gym and Fitness Module

## 10.1 Workout logging

| **Data**     | **Examples**                    |
|--------------|---------------------------------|
| Date         | 2026-09-30                      |
| Workout type | Push / Pull / Legs / Full Body  |
| Exercise     | Bench Press                     |
| Set data     | 45 kg × 8                       |
| RPE          | Optional                        |
| Duration     | 75 minutes                      |
| Notes        | Technique / pain / fatigue note |

## 10.2 Exercise progress

For each exercise, plot changes in load, repetitions, and training volume over time. A simple volume metric can be calculated as:

> Training Volume = Weight × Repetitions × Sets

## 10.3 Body progress

- Body weight

- Chest / waist / shoulders / arms / thighs (optional)

- Date-stamped front/side/back progress photos

- Measurement history chart

## 10.4 Privacy

Progress photos and body measurements are private user data. They must be protected using authenticated access and private object storage. Photos should never be publicly addressable by default.

# 11. Analytics and Reviews

## 11.1 Dashboard metrics

- Today's base score / maximum score

- Career score

- Lifestyle score

- Fitness activity

- Focused hours today / week / month

- Tasks completed / partially completed

- Current and best streak

- Goal progress

- Job funnel summary

- Workout summary

## 11.2 Weekly review

> WEEKLY REVIEW  
> Career focused time 24h 15m  
> DSA 8h 30m  
> Project 6h 15m  
> Applications 18  
> Interviews 1  
> Average score 41.6 / 55  
> Consistency 82%

## 11.3 Monthly review

The 30-day review compares planned effort with actual effort and connects the execution data to the career pipeline. Example: 150 planned career hours vs 94 actual focused hours; 100 planned applications vs 67 submitted. These are discrepancy measurements, not character judgments.

## 11.4 Deep-work metric

One of the primary dashboard metrics should be Career Deep Work Hours. Show today, this week, this month, and rolling 30-day totals.

# 12. Data Model

| **Table**          | **Purpose**                                  |
|--------------------|----------------------------------------------|
| users              | Authenticated user profile                   |
| goals              | Long-term outcomes                           |
| skills             | Skill areas associated with goals            |
| skill_milestones   | Concrete capability checkpoints              |
| tasks              | Daily measurable activities                  |
| daily_entries      | Per-day actual measurements and score inputs |
| daily_outputs      | Evidence linked to daily entries             |
| work_sessions      | Optional timer/focused-work sessions         |
| job_applications   | Application master records                   |
| application_events | Status changes and timeline events           |
| exercises          | Exercise library                             |
| workouts           | Workout sessions                             |
| workout_sets       | Per-set performance                          |
| body_measurements  | Date-stamped physical measurements           |
| progress_photos    | Metadata for private stored images           |
| weekly_reviews     | Weekly aggregate snapshots                   |
| monthly_reviews    | Monthly aggregate snapshots                  |
| audit_log          | Sensitive or retroactive changes             |

## 12.1 Relationship model

> USER  
> ├── GOALS ──┬── SKILLS ──┬── MILESTONES  
> │ │ └── TASKS  
> │ └── JOB TARGETS / OUTCOMES  
> │  
> ├── TASKS ── DAILY ENTRIES ── OUTPUTS / WORK SESSIONS  
> │  
> ├── JOB APPLICATIONS ── APPLICATION EVENTS  
> │  
> └── FITNESS ── WORKOUTS ── WORKOUT SETS  
> ├── BODY MEASUREMENTS  
> └── PROGRESS PHOTOS

# 13. Technical Architecture

Use a simple managed full-stack architecture for the first production version. Avoid creating unnecessary infrastructure that does not improve the product.

> Browser  
> │  
> ▼  
> Next.js / React / TypeScript  
> │  
> ├── Server-side data access  
> ├── Route Handlers / Server Actions  
> └── Validation + scoring services  
> │  
> ▼  
> Supabase  
> ┌──────┼─────────┐  
> │ │ │  
> PostgreSQL Auth Storage  
> │  
> Progress Photos

# 14. Technology Stack

| **Layer**       | **Technology**               | **Role**                                         |
|-----------------|------------------------------|--------------------------------------------------|
| Frontend        | Next.js + React + TypeScript | Application UI, routing, server/client rendering |
| Styling         | Tailwind CSS                 | Utility-first styling                            |
| UI components   | shadcn/ui                    | Accessible reusable components                   |
| Charts          | Recharts                     | Progress and analytics charts                    |
| Forms           | React Hook Form              | Form state and submission                        |
| Validation      | Zod                          | Runtime input validation                         |
| Backend         | Next.js server functionality | Route handlers and server actions                |
| Database        | Supabase PostgreSQL          | Persistent relational data                       |
| Auth            | Supabase Auth                | Authentication and sessions                      |
| Storage         | Supabase Storage             | Private fitness photos                           |
| Version control | Git + GitHub                 | Source control and collaboration                 |
| Deployment      | Vercel                       | Production hosting                               |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Stack principle</strong></p>
<p>Use the smallest stack that provides strong correctness, security, maintainability, and deployment. Do not add Redux, microservices, Redis, Docker orchestration, or a separate Express server unless an actual requirement emerges.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 15. Application Structure

> app/  
> ├── auth/  
> ├── dashboard/  
> ├── daily/  
> ├── goals/  
> ├── career/  
> ├── fitness/  
> ├── analytics/  
> └── settings/  
>   
> components/  
> ├── dashboard/  
> ├── daily/  
> ├── goals/  
> ├── career/  
> ├── fitness/  
> ├── charts/  
> ├── forms/  
> └── ui/  
>   
> lib/  
> ├── scoring/  
> ├── analytics/  
> ├── database/  
> ├── validation/  
> └── utils/

Scoring, analytics, validation, and database access should be separated from presentational components so that they can be unit tested independently.

# 16. UX Requirements

- Daily entry should be fast and low-friction.

- Today's highest-priority tasks should be visible immediately.

- Use clear numerical values instead of relying only on colors.

- Allow partial completion without forcing binary states.

- Show focused time and evidence in the same entry flow.

- Keep the main dashboard information-dense but visually calm.

- Use responsive layouts so the tracker is usable on a phone.

- Keep gym data inside a dedicated page with clear trends and history.

# 17. Security and Privacy

- All application data requires authenticated authorization.

- Enable database-level Row Level Security for user-owned tables.

- Store secrets only in environment variables.

- Validate all user input server-side.

- Use private storage buckets for progress photos.

- Do not expose raw storage paths unnecessarily to unauthenticated clients.

- Maintain an audit trail for sensitive changes.

- Provide a way to delete account data in a future release.

# 18. Testing Strategy

## 18.1 Unit tests

- Task scoring

- Priority cap

- Partial completion

- Bonus-hour calculation

- Consistency calculation

- Date boundaries

- Workout volume

- Hiring-funnel conversion calculations

## 18.2 Example scoring tests

> Case A  
> Priority = 10, target = 2h, actual = 1h  
> Expected = 5 points  
>   
> Case B  
> Priority = 10, target = 2h, actual = 6h  
> Expected = 10 points (capped)  
>   
> Case C  
> Priority = 5, target = 1h, actual = 0.25h  
> Expected = 1.25 points

## 18.3 Integration / E2E tests

- Sign in → load dashboard

- Create task → log entry → score updates

- Create application → change status → funnel updates

- Log workout → exercise history updates

- Upload private photo → authenticated retrieval works

- User A cannot access User B data

# 19. Development Roadmap

| **Phase** | **Deliverables**                                                              |
|-----------|-------------------------------------------------------------------------------|
| Phase 0   | Repo, README, requirements, wireframes, database ERD, coding conventions      |
| Phase 1   | Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, auth, database connection |
| Phase 2   | Tasks, daily entries, focused hours, evidence, scoring engine                 |
| Phase 3   | Dashboard, scorecards, daily/weekly/30-day charts                             |
| Phase 4   | Goals, skills, milestones, goal-task relationships                            |
| Phase 5   | Job applications, status history, hiring funnel                               |
| Phase 6   | Fitness: workouts, sets, exercise trends, measurements, photos                |
| Phase 7   | Weekly/monthly review pages, trend analysis, audit history                    |
| Phase 8   | Production hardening, security review, backups, error monitoring, domain      |

# 20. Definition of Done

The first production-ready version is considered complete when the user can perform the following workflow entirely inside the application:

1.  Create a long-term goal.

2.  Create prioritized daily tasks connected to that goal.

3.  Log focused hours and outputs each day.

4.  View the weighted daily score.

5.  View 7-day and 30-day trends.

6.  Compare planned vs actual career effort.

7.  Record job applications and status changes.

8.  View the hiring funnel.

9.  Log workouts and sets.

10. View exercise progress charts.

11. Keep fitness photos private and retrievable while authenticated.

12. Edit data safely with an audit trail.

13. Deploy the application and use it continuously for real-life tracking.

# 21. Future Enhancements

- Nutrition and food logging

- Calendar integration

- Automated weekly reports

- PWA / offline logging

- Push reminders

- Advanced focus timer

- Templates for common career goals

- Personal data export

- Multi-user SaaS support

- Optional AI-assisted weekly planning based on historical data

# 22. Implementation Rules

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 1</strong></p>
<p>Build the data model and scoring engine before polishing the dashboard.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 2</strong></p>
<p>Use focused time, not inflated elapsed time, for work metrics.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 3</strong></p>
<p>Do not allow extra hours to create unlimited base points.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 4</strong></p>
<p>Keep career, lifestyle, and fitness scoreboards analytically separate.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 5</strong></p>
<p>Measure job-search funnel progression, not only application volume.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 6</strong></p>
<p>Require evidence/output for technical work where practical.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 7</strong></p>
<p>Preserve history; never silently overwrite the past.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 8</strong></p>
<p>Keep daily logging under five minutes.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 9</strong></p>
<p>Do not encode fake certainty such as “X hours guarantees a job offer.” Hours are planning targets, not guarantees.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Rule 10</strong></p>
<p>The product should make reality easier to see, not easier to rationalize away.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Primary outcome concept:** a job offer is an external outcome; the application primarily measures the controllable system that feeds the outcome.
