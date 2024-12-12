import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text,Image, PermissionsAndroid, Platform } from 'react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';



const App = () => {
    const [overlayType, setOverlayType] = useState('none'); // Overlay type state
    const [cameraInitialized, setCameraInitialized] = useState(false); // Camera initialization state
    const cameraRef = useRef(null);
    const device = useCameraDevice('back');
  
    const renderOverlay = () => {
        switch (overlayType) {
          case 'leftSpiral':
            return (
              <Image
                source={require('./assets/spiral1.png')}
                style={styles.overlayImage}
                resizeMode="contain"
              />
            );
          case 'rightSpiral':
            return (
              <Image
                source={require('./assets/spiral2.png')}
                style={styles.overlayImage}
                resizeMode="contain"
              />
            );
          default:
            return null;
        }
      };
  
    const requestStoragePermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };
  
    const saveToGallery = async (filePath) => {
      try {
        const hasPermission = await requestStoragePermission();
        // if (!hasPermission) {
        //   console.log('Storage permission not granted');
        //   return;
        // }
        const destinationPath = `${RNFS.PicturesDirectoryPath}/photo_${Date.now()}.jpg`;
        await RNFS.copyFile(filePath, destinationPath);
        await CameraRoll.save(destinationPath, { type: 'photo' });
        console.log('Photo saved to gallery:', destinationPath);
      } catch (error) {
        console.error('Error saving photo to gallery:', error);
      }
    };
  
    const takePicture = async () => {
      try {
        if (cameraRef.current && cameraInitialized) {
          const photo = await cameraRef.current.takePhoto({});
          console.log('Photo captured:', photo.path);
          await saveToGallery(photo.path);
        } else {
          console.log('Camera not ready yet');
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    };
  
    if (!device) return <Text>Loading Camera...</Text>;
  
    return (
      <View style={styles.container}>
        <Camera
        style={styles.camera }
        device={device}
        isActive={true}
        photo={true}
        ref={cameraRef}
        onInitialized={() => setCameraInitialized(true)}
        onError={(error) => console.error('Camera error:', error)}
        formatFilter={(format) => {
            const aspectRatio = format.videoWidth / format.videoHeight;
            return Math.abs(aspectRatio - 3 / 2) < 0.01; // Close to 16:9 aspect ratio
          }}
      />
        {renderOverlay()}
  
        <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
        >
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overlaySelector}>
        <TouchableOpacity onPress={() => setOverlayType('none')} style={styles.selectorButton}>
          <Text>None</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOverlayType('leftSpiral')} style={styles.selectorButton}>
          <Text>Left Spiral</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOverlayType('rightSpiral')} style={styles.selectorButton}>
          <Text>Right Spiral</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  captureButton: {
    backgroundColor: 'blue',
    borderRadius: 50,
    padding: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  overlaySelector: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  selectorButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
});

export default App;
