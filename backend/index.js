const functions = require('@google-cloud/functions-framework');
const cors = require('cors');
const { google } = require('googleapis');

const corsMiddleware = cors({ origin: true });

const DATA_JSON_FILE_ID = process.env.GOOGLE_DRIVE_DATA_JSON_ID;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const requestCounts = new Map();
const RATE_LIMIT = 60;
const TIME_WINDOW = 60 * 1000;

function validateRequest(req, res, next) {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + TIME_WINDOW });
  } else {
    const userRequests = requestCounts.get(clientIP);
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + TIME_WINDOW;
    } else {
      userRequests.count++;
      
      if (userRequests.count > RATE_LIMIT) {
        return res.status(429).json({ 
          success: false, 
          error: 'Too many requests' 
        });
      }
    }
  }

  const userAgent = req.headers['user-agent'] || '';
  const isMobileApp = userAgent.includes('seohabogogayo') || 
                     userAgent.includes('CFNetwork') || 
                     userAgent.includes('okhttp');
  
  if (!isMobileApp && !userAgent.includes('curl')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid client' 
    });
  }
  
  next();
}

async function authenticateDrive(readOnly = true) {
  const scopes = readOnly 
    ? ['https://www.googleapis.com/auth/drive.readonly']
    : ['https://www.googleapis.com/auth/drive'];

  const auth = new google.auth.GoogleAuth({
    scopes: scopes,
  });
  
  return google.drive({ version: 'v3', auth });
}

async function getLikesData() {
  try {
    const drive = await authenticateDrive(false);
    const response = await drive.files.get({
      fileId: DATA_JSON_FILE_ID,
      alt: 'media'
    });
    
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
    
    return data || {};
  } catch (error) {
    console.error('Error reading likes data:', error);
    return {};
  }
}

async function saveLikesData(data) {
  try {
    const drive = await authenticateDrive(false);
    
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2)
    };
    
    await drive.files.update({
      fileId: DATA_JSON_FILE_ID,
      media: media,
      fields: 'id'
    });
    
    return true;
  } catch (error) {
    console.error('Error saving likes data:', error);
    return false;
  }
}

functions.http('getRandomImage', async (req, res) => {
  corsMiddleware(req, res, () => {
    validateRequest(req, res, async () => {
    try {
      const drive = await authenticateDrive(true);

      const response = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/')`,
        fields: 'files(id, name, webContentLink, webViewLink)',
        pageSize: 1000
      });
      
      const files = response.data.files;
      
      if (files.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'No images found in folder' 
        });
      }

      const randomIndex = Math.floor(Math.random() * files.length);
      const selectedFile = files[randomIndex];

      const imageResponse = await drive.files.get({
        fileId: selectedFile.id,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      const metadataResponse = await drive.files.get({
        fileId: selectedFile.id,
        fields: 'mimeType'
      });

      const base64Image = Buffer.from(imageResponse.data).toString('base64');
      const mimeType = metadataResponse.data.mimeType || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const likesData = await getLikesData();
      const likeCount = likesData[selectedFile.name] || 0;
      
      res.json({
        success: true,
        data: {
          url: dataUrl,
          name: selectedFile.name,
          likeCount: likeCount
        }
      });
      
    } catch (error) {
      console.error('Error fetching random image:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch image'
      });
    }
    });
  });
});

functions.http('likeImage', async (req, res) => {
  corsMiddleware(req, res, () => {
    validateRequest(req, res, async () => {
    try {
      const imageName = req.path.split('/').pop();
      
      if (!imageName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Image name is required' 
        });
      }
      
      const decodedImageName = decodeURIComponent(imageName);
      const likesData = await getLikesData();

      if (!likesData[decodedImageName]) {
        likesData[decodedImageName] = 0;
      }
      likesData[decodedImageName]++;

      const saved = await saveLikesData(likesData);
      
      if (saved) {
        res.json({ 
          success: true, 
          likeCount: likesData[decodedImageName] 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to save like data' 
        });
      }
      
    } catch (error) {
      console.error('Error processing like:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process like'
      });
    }
    });
  });
});