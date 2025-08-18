import { useState, useEffect } from 'react';
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  useColorScheme, 
  View,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const API_URL = __DEV__ 
    ? 'http://10.0.2.2:3000/api/random-image'
    : 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getRandomImage';
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageName, setImageName] = useState<string>('');
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeCooldown, setLikeCooldown] = useState(false);
  
  const fetchRandomImage = async () => {
    setLoading(true);
    setError(null);
    setLikeCooldown(false);
    
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.success) {
        setImageUrl(data.data.url);
        setImageName(data.data.name);
        setLikeCount(data.data.likeCount || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch image');
      }
    } catch (err) {
      setError('이미지를 불러올 수 없습니다');
      const fallbackImages = [
        'https://picsum.photos/400/600?random=1',
        'https://picsum.photos/400/600?random=2', 
        'https://picsum.photos/400/600?random=3',
      ];
      const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      setImageUrl(randomFallback);
      setImageName('Test Image (API Failed)');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRandomImage();
  }, []);
  
  const handleNextImage = () => {
    fetchRandomImage();
  };
  
  const handleLike = async () => {
    if (likeCooldown || !imageName) return;
    
    setLikeCooldown(true);
    setLikeCount(prev => prev + 1);
    
    try {
      const likeApiUrl = __DEV__ 
        ? `http://10.0.2.2:3000/api/like/${encodeURIComponent(imageName)}`
        : `https://YOUR-CLOUD-FUNCTION-URL/api/like/${encodeURIComponent(imageName)}`;
      
      const response = await fetch(likeApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ increment: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLikeCount(data.likeCount);
      } else {
        setLikeCount(prev => prev - 1);
      }
    } catch (error) {
      setLikeCount(prev => prev - 1);
    }
    
    setTimeout(() => {
      setLikeCooldown(false);
    }, 5000);
  };
  
  const formatLikeCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.imageWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>이미지 불러오는 중...</Text>
              </View>
            ) : imageUrl ? (
              <Image 
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => {
                  setError('이미지 로드 실패: ' + imageUrl.substring(0, 50) + '...');
                }}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>이미지가 없습니다</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={[styles.likeButton, likeCooldown && styles.likeButtonDisabled]}
              onPress={handleLike}
              activeOpacity={likeCooldown ? 1 : 0.7}
              disabled={likeCooldown}
            >
              <Text style={styles.likeIcon}>❤️</Text>
              <Text style={styles.likeText}>
                Like
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.likeCount}>{formatLikeCount(likeCount)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNextImage}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>다음 사진 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: screenWidth - 40,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  likeButtonDisabled: {
    opacity: 0.5,
  },
  likeIcon: {
    fontSize: 16,
  },
  likeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
  likeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#5B9EE1',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#5B9EE1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
  },
});

export default App;