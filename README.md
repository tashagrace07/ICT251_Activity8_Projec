# ICT251 Activity 8 – Frontend and Backend Integration

This starter uses Express and SQLite through **sql.js**, a pure-JavaScript/WebAssembly implementation. It does not require Visual Studio C++ Build Tools to install.

## Run backend locally
Use Node.js 22 or newer. In a terminal opened in `backend`, run:
```bash
npm install
npm start
```
API: `http://localhost:3000`
- Health: `/health`
- Records: `/api/records`
- API guide: `/api-guide`

The database file is created at `backend/data/records.db`.

## Run frontend locally
Use VS Code Live Server to open `frontend/index.html`. The local API URL is set in `frontend/js/config.js`.

## Deploy backend to Render
1. Push the project to GitHub.
2. Create a Render Web Service connected to the repository.
3. Root Directory: `backend`; Build Command: `npm install`; Start Command: `npm start`.
4. Set `CLIENT_ORIGINS` to the Netlify site origin once known (example `https://your-site.netlify.app`).
5. For durable SQLite data, attach a persistent disk mounted at `/var/data` and set `DB_PATH=/var/data/records.db`. Without persistent storage, local database files may be lost on redeploy. Persistent disks may require a paid plan.
6. Deploy and test the Render `/health` URL.

## Deploy frontend to Netlify
1. Change `frontend/js/config.js` from `http://localhost:3000` to your Render HTTPS URL (no trailing slash).
2. Commit and push the change.
3. Import the GitHub repository in Netlify. Base directory: `frontend`; build command: blank; publish directory: `.`.
4. After deployment, set `CLIENT_ORIGINS` on Render to the Netlify site origin and redeploy/restart the backend.

Before submitting, replace the student name and number placeholders in the frontend About section. Submit the live Netlify frontend URL, not localhost, GitHub, or the Render dashboard URL.
