# Firebase Setup

This project now supports:

- Firebase Hosting for deployment
- Firebase Auth for admin sign-in
- Firebase Storage for photo and logo uploads
- Firestore for media slot metadata and contact submissions

## 1. Create a Firebase project

1. Go to the Firebase console.
2. Create a new project.
3. Add a Web App to the project.
4. Copy the Firebase web config into [assets/js/firebase-config.js](C:/Users/Frames%20of%20Two/Documents/BFT%20Landforming%20Website/assets/js/firebase-config.js).

## 2. Enable services

Enable these Firebase products:

- Authentication
- Firestore Database
- Storage
- Hosting

For Authentication, enable `Email/Password`.

## 3. Create an admin user

1. In Firebase Authentication, create the email/password user you want to use for the admin panel.
2. Sign in once on `admin.html` after deployment or locally.
3. Copy that user's UID from the browser console or Authentication users list.
4. In Firestore, create the document:

`admins/{YOUR_UID}`

Suggested document data:

```json
{
  "email": "your-admin-email@example.com",
  "name": "Site Admin",
  "createdAt": "use Firestore timestamp"
}
```

The Firebase Console can create this document even before client-side admin access is working.

## 4. Deploy rules and hosting

From the project folder:

```powershell
firebase login
firebase use --add
firebase deploy
```

## 5. Admin workflow

After deployment:

1. Open `/admin.html`
2. Sign in with the admin email and password
3. Upload logos and photos into the media slots
4. The public website will load those uploaded images automatically
5. Contact form submissions will appear in the admin dashboard

## Notes

- Public pages fall back to local placeholder images until Firebase is configured.
- Uploaded files are stored in Firebase Storage under `site-assets/{slotId}/...`
- Public site image metadata is stored in Firestore at `siteContent/current`
