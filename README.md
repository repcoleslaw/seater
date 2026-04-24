# Seating Planner MVP

Simple no-login seating planner web app. Users can:
- Add guests manually or upload a CSV.
- Define constraints (`must_pair`, `cannot_pair`, `prefer_near`).
- Define uneven table capacities.
- Generate and retry seating plans.
- Download final assignments as CSV.

Data is kept local to the browser session and is cleared after final CSV download.

## Quick Local Run

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:

- [http://localhost:3000](http://localhost:3000)

## CSV Examples (Exact)

### Input Guest CSV (minimum format)

Must include a `name` header.

```csv
name
Alice Johnson
Bob Chen
Carla Diaz
Daniel Reed
```

### Input Guest CSV (with extra columns)

Extra columns are allowed. Only the `name` column is used.

```csv
name,email,group
Alice Johnson,alice@example.com,Family
Bob Chen,bob@example.com,Friends
Carla Diaz,carla@example.com,Work
```

### Output Assignment CSV

Downloaded format is exactly:

```csv
guest_name,table_label,seat_index
Alice Johnson,Table 1,1
Bob Chen,Table 1,2
Carla Diaz,Table 2,1
Daniel Reed,Table 2,2
```

## Build and Test

```bash
npm run lint
npm test
npm run build
```

## Quick Deploy (Vercel)

### Option A: Vercel CLI

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. From project root, deploy:

```bash
vercel
```

3. For production deploy:

```bash
vercel --prod
```

### Option B: Vercel Dashboard + Git

1. Push project to GitHub/GitLab/Bitbucket.
2. In Vercel, choose **Add New Project**.
3. Import the repo and keep defaults for Next.js.
4. Click **Deploy**.

No environment variables are required for this MVP.
