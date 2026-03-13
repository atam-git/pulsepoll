# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads in PulsePoll.

## Why Cloudinary?

- **Free tier**: 25 GB storage, 25 GB bandwidth/month
- **Automatic optimization**: Images are automatically optimized for web
- **CDN included**: Fast image delivery worldwide
- **Easy integration**: Simple API with Node.js SDK

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials

After logging in:

1. Go to your **Dashboard** (https://console.cloudinary.com/)
2. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**: e.g., `dxyz123abc`
   - **API Key**: e.g., `123456789012345`
   - **API Secret**: e.g., `abcdefghijklmnopqrstuvwxyz123456`

### 3. Add Credentials to Your Project

#### For Local Development:

Edit `pulsepoll/.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these three variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
4. Click **Save**
5. Redeploy your application

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the poll creation page
3. Try uploading an image
4. Check your Cloudinary dashboard to see the uploaded image in the `pulsepoll` folder

## How It Works

1. User uploads an image through the poll creation form
2. Image is validated (type, size) on the server
3. Image is processed with Sharp (resized to max 1200x800, optimized)
4. Processed image is uploaded to Cloudinary
5. Cloudinary returns a secure URL (e.g., `https://res.cloudinary.com/your-cloud/image/upload/v123/pulsepoll/abc123.jpg`)
6. This URL is stored in the database and used to display the image

## Features

- **Automatic resizing**: Images are resized to max 1200x800 pixels
- **Format conversion**: All images are converted to JPEG for consistency
- **Quality optimization**: Images are compressed to 85% quality
- **Secure URLs**: All images are served over HTTPS
- **CDN delivery**: Fast loading from Cloudinary's global CDN
- **Organized storage**: All images are stored in the `pulsepoll` folder

## Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

For a typical poll app, this is more than enough for thousands of polls with images.

## Troubleshooting

### "Failed to upload image" error

1. Check that your credentials are correct in `.env.local`
2. Make sure you've restarted your dev server after adding credentials
3. Check the server console for detailed error messages

### Images not showing up

1. Check that the URL returned from the API is valid
2. Open the URL in a browser to see if the image loads
3. Check your Cloudinary dashboard to see if the image was uploaded

### "Invalid credentials" error

1. Double-check your Cloud Name, API Key, and API Secret
2. Make sure there are no extra spaces or quotes in your `.env.local` file
3. Try regenerating your API Secret in the Cloudinary dashboard

## Next Steps

Once set up, image uploads will work automatically in:
- Poll creation (optional image for polls)
- Poll editing (update poll images)
- All environments (local, staging, production)

## Support

- Cloudinary Documentation: https://cloudinary.com/documentation
- Cloudinary Node.js SDK: https://cloudinary.com/documentation/node_integration
- PulsePoll Issues: [Your GitHub repo issues page]
