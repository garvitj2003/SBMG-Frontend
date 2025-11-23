# Google Maps Production Deployment Fix

## Issue
Google Maps works on `localhost:5173` but shows errors on production `http://15.206.174.7/dashboard`:
- `ApiProjectMapError`
- `NoApiKeys`

## Root Causes

1. **GitHub Actions Secret Not Set** - The `VITE_GOOGLE_MAPS_API_KEY` secret might not be configured
2. **Google Cloud Console Domain Restrictions** - Production domain not allowed
3. **API Key Not Embedded in Build** - The environment variable wasn't available during build

## Fix Steps

### Step 1: Verify GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Check if `VITE_GOOGLE_MAPS_API_KEY` exists
4. If it doesn't exist:
   - Click **New repository secret**
   - Name: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
   - Click **Add secret**

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your API key
5. Under **Application restrictions**, select **HTTP referrers (web sites)**
6. Add the following referrers:
   ```
   http://15.206.174.7/*
   https://15.206.174.7/*
   http://localhost:5173/*
   http://localhost:*/*
   https://localhost:*/*
   ```
   
   **Note**: 
   - `http://localhost:5173/*` - Specific port for Vite dev server
   - `http://localhost:*/*` - Covers all localhost ports
   - `https://localhost:*/*` - For HTTPS localhost (if needed)
7. Under **API restrictions**, ensure **Maps JavaScript API** is enabled
8. Click **Save**

### Step 3: Verify API Key Status

1. In Google Cloud Console, go to **APIs & Services** → **Dashboard**
2. Ensure **Maps JavaScript API** is **ENABLED**
3. Check if billing is enabled for your project

### Step 4: Rebuild and Redeploy

After setting the GitHub secret, you need to trigger a new build:

```bash
# Option 1: Push a commit to trigger the workflow
git commit --allow-empty -m "Trigger rebuild for Google Maps API key"
git push origin main

# Option 2: Manually trigger the workflow in GitHub Actions
```

### Step 5: Verify the Build

After deployment, check the browser console on production:
1. Open `http://15.206.174.7/dashboard`
2. Open browser DevTools (F12)
3. Check Console for: `🗺️ Google Maps API Key: AIzaSyA1...` (should show first 10 chars, not "NOT FOUND")
4. If it shows "NOT FOUND", the secret wasn't available during build

## Debugging

### Check if API Key is in Build

You can verify the API key is embedded in the build by checking the built JavaScript file:

```bash
# On your production server, check the built file
grep -r "VITE_GOOGLE_MAPS_API_KEY" /var/www/SBMG-frontend/assets/
# Should NOT find the variable name (it should be replaced with the actual key)

# Check if API key pattern exists
grep -r "AIza" /var/www/SBMG-frontend/assets/
# Should find your API key (starts with AIza)
```

### Test API Key Directly

You can test your API key works with the production domain:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
```

## Common Issues

### Issue: "NoApiKeys" error
**Solution**: The GitHub secret is not set or not accessible during build. Follow Step 1.

### Issue: "ApiProjectMapError" with valid key
**Solution**: 
- Domain restrictions not configured (Step 2)
- Billing not enabled
- Maps JavaScript API not enabled

### Issue: Works in localhost but not production
**Solution**: Production domain `15.206.174.7` not added to HTTP referrer restrictions (Step 2).

### Issue: "RefererNotAllowedMapError" in localhost
**Solution**: Add localhost referrers to your API key restrictions:
- `http://localhost:5173/*` (for specific port)
- `http://localhost:*/*` (for all localhost ports)
- `https://localhost:*/*` (for HTTPS localhost)

## Security Notes

⚠️ **Important**: Since the API key is embedded in the client-side code, anyone can see it in the browser. Make sure to:

1. ✅ Restrict the API key to specific HTTP referrers (domains)
2. ✅ Restrict the API key to only necessary APIs (Maps JavaScript API)
3. ✅ Enable billing alerts in Google Cloud Console
4. ❌ Don't use an unrestricted API key

## After Fix

Once fixed, you should see:
- ✅ No console errors
- ✅ Map loads correctly
- ✅ Console shows: `🗺️ Google Maps API Key: AIzaSyA1...` (not "NOT FOUND")
