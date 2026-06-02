# Sports Tracker

An all-in-one sports and activities tracker that combines auto-detected activities from Google Fit with manual strength workout logging.

## Features

- 🚴 **Google Fit Integration**: Auto-sync walking, hiking, cycling, and other detected activities
- 💪 **Strength Workouts**: Manually log strength training and other activities that Google Fit doesn't auto-detect
- 📊 **Weekly Dashboard**: Quick stats and activity overview
- 📱 **Mobile Friendly**: Works great on phone and desktop browsers
- 💾 **Local Testing**: Uses CSV for local storage during development

## Project Structure

```
sports-tracker/
├── backend/          # Node.js/Express server
│   ├── routes/       # API endpoints
│   ├── utils/        # Helper functions (CSV handling)
│   ├── data/         # activities.csv (created on first use)
│   └── server.js     # Main server file
└── frontend/         # React app
    ├── public/       # Static files
    ├── src/
    │   ├── components/  # React components
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Google OAuth Setup

You need to create OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Fit API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - Later: your deployed domain
7. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Google credentials:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
PORT=3001
```

## Running Locally

### Start Backend

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

### Start Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## How to Use

1. **Add Activities Manually**:
   - Fill the form to add strength workouts, yoga, or any activity
   - Choose activity type, name, date, and duration

2. **Sync with Google Fit**:
   - Click "Login with Google" to authenticate
   - After login, click "Sync Now" to fetch your recent activities
   - Choose the date range (last 7/30/90 days)
   - Auto-detected activities appear in the list

3. **View Dashboard**:
   - See this week's stats: total activities, time, breakdown by type
   - View all activities sorted by date (newest first)
   - Delete manually added activities (can't delete Google Fit ones)

## Testing Without Google Fit

You can test the app by just adding manual activities. No need to set up Google OAuth if you want to:
- Just test the form and dashboard
- Try CSV handling locally
- See the UI in action

## CSV Data

Activities are stored in `backend/data/activities.csv`. You can:
- Edit it manually to add test data
- View it to see the structure
- Delete it to start fresh

Example row:
```
id,type,name,date,duration,notes,source,createdAt
123456,Strength Training,Bench Press,2025-06-02,45,,manual,2025-06-02T10:30:00Z
```

## Development Notes

- **Backend**: Node.js + Express, handles OAuth and CSV I/O
- **Frontend**: React, responsive design, uses axios for API calls
- **Storage**: CSV locally (will upgrade to Google Sheets for deployment)
- **No database**: Everything is file-based during development

## Next Steps (When Ready to Deploy)

- Switch from CSV to Google Sheets backend
- Deploy backend to Vercel or Render
- Deploy frontend to GitHub Pages
- Add more stats and visualizations
- Export data features

## Troubleshooting

**"Can't connect to backend"**: Make sure backend is running on port 3001

**"Google login fails"**: Check that Client ID matches your `.env` file

**"Activities not saving"**: Check that `backend/data/` folder exists and has write permissions

**CORS errors**: Backend CORS is configured for `http://localhost:3000`, change if running on different port
