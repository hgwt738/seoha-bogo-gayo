import { useState } from 'react';
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  useColorScheme, 
  View,
  Image,
  Dimensions,
  ScrollView 
} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  // TODO: 클라우드 이미지 대체
  const images = [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3',
    'https://picsum.photos/400/600?random=4',
    'https://picsum.photos/400/600?random=5',
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const handleNextImage = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * images.length);
    } while (newIndex === currentImageIndex);
    setCurrentImageIndex(newIndex);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>서하보고가요</Text>
        <Text style={styles.subtitle}>제 딸 자랑할려고 만든거에요</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: images[currentImageIndex] }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNextImage}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>다음 사진 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: '#4ECDC4',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#B2F2EA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nextButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
