# 서하보고가요
단순 딸 사진을 자랑하기 위한 앱

## 환경 설정

### 1. 환경변수 파일 세팅
Backend 폴더에 `.env` 파일을 생성하고 다음 내용을 입력:

```bash
cd backend
cp .env.example .env
```

`.env` 파일 내용:
```
# Google Drive 이미지 폴더 ID
GOOGLE_DRIVE_FOLDER_ID=your_images_folder_id_here

# Google Drive data.json 파일 ID
GOOGLE_DRIVE_DATA_JSON_ID=your_data_json_file_id_here

# Google Drive 부모 폴더 ID
GOOGLE_DRIVE_PARENT_FOLDER_ID=your_parent_folder_id_here
```

### 2. Google 서비스 계정 키 세팅
1. [Google Cloud Console](https://console.cloud.google.com)에서 서비스 계정 생성
2. JSON 키 파일 다운로드
3. `backend/service-account-key.json`으로 저장

### 3. Google Drive 권한 설정
1. Google Drive에서 이미지 폴더와 data.json 파일 생성
2. 서비스 계정 이메일로 폴더/파일 공유 (뷰어 또는 편집자 권한)

## 실행

### 1. 설치
```bash
npm install

# Backend 폴더에서
cd backend
npm install
```

### 2. Backend 서버
```bash
cd backend
npm start
```

### 3. Metro 번들러
```bash
npm start
```

### 4. 앱

#### iOS 실행 (Mac만 가능)
```bash
npm run ios
```

#### Android 실행
```bash
npm run android
```
Android Studio 에뮬레이터는 미리 실행