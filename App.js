// Import necessary libraries and components
import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, PermissionsAndroid, Platform, FlatList } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import SendIntentAndroid from 'react-native-send-intent';

const App = () => {
  const [activeOverlays, setActiveOverlays] = useState([]); // Active overlays
  const [cameraInitialized, setCameraInitialized] = useState(false); // Camera initialization state
  const [showOverlayOptions, setShowOverlayOptions] = useState(false); // Toggle overlay options
  const [lastPhotoPath, setLastPhotoPath] = useState(null); // Last photo path
  const cameraRef = useRef(null);
  const device = useCameraDevice('back');

  const overlayImages = {
    leftTopSpiral: require('./assets/Overlay/Landscape/GoldS-LT-L.png'),
    rightTopSpiral: require('./assets/Overlay/Landscape/GoldS-RT-L.png'),
    ruleOfThirds: require('./assets/Overlay/Landscape/ROT-L.png'),
    leftBottomSpiral: require('./assets/Overlay/Landscape/GoldS-LB-L.png'), 
    rightBottomSpiral: require('./assets/Overlay/Landscape/GoldS-RB-L.png'), 
    leftTopTriangle:require('./assets/Overlay/Landscape/GoldT-LT-L.png'), 
    rightTopTriangle: require('./assets/Overlay/Landscape/GoldT-RT-L.png'), 
    goldenRatio: require('./assets/Overlay/Landscape/GoldR-L.png'), 
    goldenRectHori: require('./assets/Overlay/Landscape/Rect-Horizontal.png'), 
    goldenRectVert: require('./assets/Overlay/Landscape/Rect-Vertical.png'), 
    diagCenter: require('./assets/Overlay/Landscape/DiagCenter.png'), 
  };
  const toggleOverlay = (overlay) => {
    setActiveOverlays((prev) => {
      if (prev.includes(overlay)) {
        return prev.filter((o) => o !== overlay);
      } else {
        return [...prev, overlay];
      }
    });
  };

  const renderOverlays = () => {
    return activeOverlays.map((overlay, index) => {
      const overlaySource = overlayImages[overlay];

      if (!overlaySource) {
        console.warn(`No image found for overlay: ${overlay}`);
        return null;
      }

      return (
        <Image
          key={index}
          source={overlaySource}
          style={styles.overlayImage}
          resizeMode="contain"
        />
      );
    });
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
      if (!hasPermission) {
        console.log('Storage permission not granted');
        return;
      }
      const destinationPath = `${RNFS.PicturesDirectoryPath}/photo_${Date.now()}.jpg`;
      await RNFS.copyFile(filePath, destinationPath);
      await CameraRoll.save(destinationPath, { type: 'photo' });
      console.log('Photo saved to gallery:', destinationPath);
      setLastPhotoPath(destinationPath); // Save the last photo path
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

  const openLastPhotoInSnapseed = async () => {
    if (lastPhotoPath) {
      try {
        if (Platform.OS === 'android') {
          const fileUri = `file://${lastPhotoPath}`;

        const providerUri = `content://com.composingcam.fileprovider/${lastPhotoPath}`;
        
        SendIntentAndroid.openAppWithData(
          'com.niksoftware.snapseed',
          providerUri,
          'image/*'
        );
        }
      } catch (error) {
        console.error('Error opening Snapseed:', error);
      }
    } else {
      console.log('No photo available to view');
    }
  };
  
  

  if (!device) return <Text>Loading Camera...</Text>;

  const overlays = [
    { id: 'ruleOfThirds', label: 'Rule of Thirds'},
    { id: 'goldenRatio', label: 'Golden ratio'},
    { id: 'goldenRectHori', label: 'Rectangle Hori'},
    { id: 'goldenRectVert', label: 'Reactangle Vert'},
    { id: 'diagCenter', label: 'Diagonal Center'},
    { id: 'leftTopSpiral', label: 'Left Top Spiral' },
    { id: 'rightTopSpiral', label: 'Right Top Spiral' },
    { id: 'leftBottomSpiral', label: 'Left Bottom Spiral'},
    { id: 'rightBottomSpiral', label: 'Right bottom Spiral'},
    { id: 'leftTopTriangle', label: 'Left Golden Triangle'},
    { id: 'rightTopTriangle', label: 'Right Golden Triangle'},
  ];

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        ref={cameraRef}
        onInitialized={() => setCameraInitialized(true)}
        onError={(error) => console.error('Camera error:', error)}
        formatFilter={(format) => {
          const aspectRatio = format.videoWidth / format.videoHeight;
          return Math.abs(aspectRatio - 3 / 2) < 0.01; // Close to 3:2 aspect ratio
        }}
      />
      {renderOverlays()}

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureCircle} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overlayToggleButton}
          onPress={() => setShowOverlayOptions(!showOverlayOptions)}
        >
          <Text style={styles.toggleButtonText}>Overlays</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lastPhotoButton}
          onPress={openLastPhotoInSnapseed}
        >
          <Text style={styles.toggleButtonText}>Snapseed</Text>
        </TouchableOpacity>
      </View>

      {showOverlayOptions && (
        <View style={styles.overlayListContainer}>
          <FlatList
            horizontal
            data={overlays}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.overlayButton,
                  activeOverlays.includes(item.id) && styles.overlayButtonActive,
                ]}
                onPress={() => toggleOverlay(item.id)}
              >
                <Text style={styles.overlayButtonText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
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
  bottomControls: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    alignItems: 'center',
  },
  captureCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: '#e6e6e6',
  },
  overlayToggleButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lastPhotoButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
  },
  overlayListContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
  },
  overlayButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: 'lightgray',
  },
  overlayButtonActive: {
    backgroundColor: 'dodgerblue',
  },
  overlayButtonText: {
    color: 'white',
  },
});

export default App;
