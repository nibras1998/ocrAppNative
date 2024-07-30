import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, ActivityIndicator, PermissionsAndroid, Platform, ScrollView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import textRecognition from '@react-native-ml-kit/text-recognition';

// Simulated database
const fetchPreviousReading = async (consumerId: string) => {
  // Simulate fetching previous reading from the database
  // This could be replaced with an actual API call
  return new Promise<number>((resolve) => setTimeout(() => resolve(1234), 1000)); // Dummy previous reading
};

// Simulated tariff calculation
const calculateTariff = (currentReading: number, previousReading: number) => {
  const consumption = currentReading - previousReading;
  const tariffRate = 0.2; // Example tariff rate per unit
  return consumption * tariffRate;
};

const MeterReader = () => {
  const device = useCameraDevice('back');
  const { hasPermission: hasCameraPermission } = useCameraPermission();
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [previousReading, setPreviousReading] = useState<number | null>(null);
  const [currentReading, setCurrentReading] = useState<number | null>(null);
  const [tariff, setTariff] = useState<number | null>(null);
  const cameraRef = useRef<Camera>(null);

  // Request all necessary permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Required',
            message: 'App needs access to your camera',
          }
        );

        const audioPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission Required',
            message: 'App needs access to your microphone',
          }
        );

        const readMediaImagesPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Read Media Images Permission Required',
            message: 'App needs access to your media images',
          }
        );

        if (
          cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
          audioPermission === PermissionsAndroid.RESULTS.GRANTED &&
          readMediaImagesPermission === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasPermissions(true);
        } else {
          console.log('One or more permissions were denied');
          setHasPermissions(false);
        }
      } catch (err) {
        console.warn(err);
        setHasPermissions(false);
      }
    } else {
      setHasPermissions(true);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  if (!hasCameraPermission || !hasPermissions) return <PermissionsPage />;
  if (device == null) return <NoCameraDeviceError />;

  const takePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
        });
        if (photo) {
          const fileUri = `file://${photo.path}`;
          setCapturedImageUri(fileUri);
          processImage(fileUri);
        }
      }
    } catch (error) {
      console.error('Capture Error:', error);
    }
  };

  const processImage = async (imagePath: string) => {
    setIsProcessing(true);
    try {
      const result = await textRecognition.recognize(imagePath);
      if (result) {
        const extractedText = result.text;
        setOcrResult(extractedText);

        // Simulate extracting meter reading from OCR result
        const meterReading = extractMeterReading(extractedText);
        if (meterReading !== null) {
          setCurrentReading(meterReading);
          const consumerId = 'dummy-consumer-id'; // Simulated consumer ID
          const prevReading = await fetchPreviousReading(consumerId);
          setPreviousReading(prevReading);
          const calculatedTariff = calculateTariff(meterReading, prevReading);
          setTariff(calculatedTariff);
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractMeterReading = (text: string): number | null => {
    // Simple extraction logic, adjust as needed
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  const goBackToPreview = () => {
    setCapturedImageUri(null);
    setOcrResult(null);
    setCurrentReading(null);
    setPreviousReading(null);
    setTariff(null);
  };

  return (
    <ScrollView style={styles.container}>
      {capturedImageUri ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImageUri }}
            style={styles.capturedImage}
          />
          {isProcessing ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.activityIndicator} />
          ) : (
            <View style={styles.ocrResultContainer}>
              <Text style={styles.ocrResult}>{ocrResult}</Text>
              {currentReading !== null && previousReading !== null && tariff !== null && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultText}>Previous Reading: {previousReading}</Text>
                  <Text style={styles.resultText}>Current Reading: {currentReading}</Text>
                  <Text style={styles.resultText}>Tariff: ${tariff.toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}
          <Button title="Back to Preview" onPress={goBackToPreview} />
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
          <Button title="Capture" onPress={takePhoto} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
  },
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
    margin: 20,
  },
  camera: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  capturedImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  ocrResultContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  ocrResult: {
    fontSize: 16,
    color: '#212529',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 10,
  },
  activityIndicator: {
    marginVertical: 20,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

const PermissionsPage = () => (
  <View style={styles.page}>
    <Text style={styles.pageText}>Camera, microphone, and storage permissions are required to use this feature.</Text>
  </View>
);

const NoCameraDeviceError = () => (
  <View style={styles.page}>
    <Text style={styles.pageText}>No back camera device found.</Text>
  </View>
);

export default MeterReader;
