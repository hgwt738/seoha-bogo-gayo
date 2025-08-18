const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATA_JSON_FILE_ID = process.env.GOOGLE_DRIVE_DATA_JSON_ID;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function authenticateDrive(readOnly = true) {
  const path = require('path');
  const keyPath = path.join(__dirname, 'service-account-key.json');
  
  const scopes = readOnly 
    ? ['https://www.googleapis.com/auth/drive.readonly']
    : ['https://www.googleapis.com/auth/drive'];
  
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
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

async function updateLikesData(likesData) {
  try {
    const drive = await authenticateDrive(false);
    await drive.files.update({
      fileId: DATA_JSON_FILE_ID,
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(likesData, null, 2)
      }
    });
    return true;
  } catch (error) {
    console.error('Error updating likes data:', error);
    return false;
  }
}

app.get('/api/random-image', async (req, res) => {
  try {
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'YOUR_FOLDER_ID_HERE';
    const drive = await authenticateDrive();
    
    // 폴더에서 이미지 목록 가져오기
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/') and trashed = false`,
      fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink)',
      pageSize: 1000,
    });
    
    const files = response.data.files;
    
    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No images found in the specified folder',
      });
    }

    const randomIndex = Math.floor(Math.random() * files.length);
    const selectedFile = files[randomIndex];
    
    // Android 에뮬레이터용 프록시 서버 URL (10.0.2.2 = localhost)
    const proxyUrl = `http://10.0.2.2:3000/api/image/${selectedFile.id}`;
    const likesData = await getLikesData();
    const likeCount = likesData[selectedFile.name] || 0;
    
    res.json({
      success: true,
      data: {
        id: selectedFile.id,
        name: selectedFile.name,
        url: proxyUrl,
        thumbnailUrl: selectedFile.thumbnailLink,
        webViewLink: selectedFile.webViewLink,
        likeCount: likeCount,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/all-images', async (req, res) => {
  try {
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'YOUR_FOLDER_ID_HERE';
    const drive = await authenticateDrive();
    
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/') and trashed = false`,
      fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink)',
      pageSize: 1000,
    });
    
    const images = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      url: `http://10.0.2.2:3000/api/image/${file.id}`,
      thumbnailUrl: file.thumbnailLink,
      webViewLink: file.webViewLink,
    }));
    
    res.json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/image/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const drive = await authenticateDrive();

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load image'
    });
  }
});

app.post('/api/like/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const { increment = true } = req.body;

    const likesData = await getLikesData();
    const currentCount = likesData[fileName] || 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
    likesData[fileName] = newCount;

    const success = await updateLikesData(likesData);
    if (success) {
      res.json({
        success: true,
        fileName: fileName,
        likeCount: newCount
      });
    } else {
      throw new Error('Failed to update likes');
    }
  } catch (error) {
    console.error('Like update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}/api/random-image`);
});