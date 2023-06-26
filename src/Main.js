import React, {useEffect, useState} from 'react';
import {StyleSheet, View, PermissionsAndroid, Image} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from 'react-native-geolocation-service';
import {request, PERMISSIONS} from 'react-native-permissions';
import InfoContainer from './components/infocontainer';
import LogoContainer from './components/LogoContainer';
import ImageContainer from './components/ImageContainer';
import DateContainer from './components/DateContainer';
import CustomButton from './components/CustomButton';
import {RNCamera} from 'react-native-camera';
import {useCamera} from 'react-native-camera-hooks';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

const Main = () => {
  const [{cameraRef}, {takePicture}] = useCamera(null);
  const [capturedImage, setCapturedImage] = useState();
  const [chargingStatus, setChargingStatus] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [location, setLocation] = useState(null);
  const [connectivityStatus, setConnectivityStatus] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const [dateTime, setDateTime] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [frequency,setFrequency] = useState(15)

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        console.log('Location permission denied');
      }
    } catch (error) {
      console.log('Error requesting location permission: ', error);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation([latitude, longitude]);
      },
      error => {
        console.log('Error getting current location: ', error);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  useEffect(() => {
    requestCameraPermission();
    requestLocationPermission();
    uploadInfos()
    

      const intervalId = setInterval(async() => {

      uploadInfos()
      }, frequency * 60 * 1000);
 

    return () => {
      clearInterval(intervalId);
    };
  }, [connectivityStatus]);

  const requestCameraPermission = async () => {
    try {
      const granted = await request(PERMISSIONS.ANDROID.CAMERA);
      if (granted === 'granted') {
        console.log('Camera permission granted');
      } else {
        console.log('Camera permission denied');
      }
    } catch (error) {
      console.log('Error requesting camera permission:', error);
    }
  };
  const getDateTime = () => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}-${
      currentDate.getMonth() + 1
    }-${currentDate.getFullYear()}`;
    const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
    const formattedDateTime = `${formattedDate}   ${formattedTime}`;
    setDateTime(formattedDateTime);
  };
  const getInfos = async () => {
    const isCharging = await DeviceInfo.isBatteryCharging();
    setChargingStatus(isCharging);

    DeviceInfo.getBatteryLevel().then(batteryLevel => {
      setBatteryLevel(Math.round(batteryLevel * 100));
    });
    await NetInfo.addEventListener(networkState => {
      setConnectivityStatus(networkState.isConnected);
      console.log('Is connected? - ', connectivityStatus);
    });
    getDateTime();
    getCurrentLocation();
    setCaptureCount(captureCount + 1);
    if (cameraRef) {
      handleCapture();
    } else {
      console.log('waiting for camera to setup...');
    }
  };
  const uploadImage = async () => {
    try {
      const reference = await storage().ref(`img${Date.now()}`);
      const pathToFile = capturedImage;
      // uploads file
      await reference.putFile(pathToFile);
      // gets download URL
      const url = await reference.getDownloadURL();
      // sets state with download URL
      await setDownloadUrl(url);

      console.log('File available at', url);
    } catch (error) {
      console.log(error);
    }
  };
  const handleCapture = async () => {
    try {
      if (cameraRef.current) {
        takePicture().then(data => {
          setCapturedImage(data.uri);

          console.log('Captured image:', capturedImage);
        });
      } else {
        console.log('Error capturing image ');
      }
    } catch (error) {
      console.log('Error capturing image:', error);
      setTimeout(handleCapture, 500);
    }
  };
  const uploadInfos = async () => {
    getInfos();

    const latestInfo = {
      captureCount,
      connectivityStatus: connectivityStatus ? 'Yes' : 'No',
      chargingStatus: chargingStatus ? 'Yes' : 'No',
      batteryLevel,
      downloadUrl,
      location,
      dateTime,
    };
    console.log('latestInfo', latestInfo);
    if (connectivityStatus) {
     
      let data = await getData();
      if (data) {
        try {
          const collection = firestore()
            .collection('deviceInfos')
            .add(data)
            .then(() => {
              uploadImage();
              console.log('data added successfuly');
              AsyncStorage.clear()
              
            });
        } catch (error) {
          console.log('Error uploading device info:', error);
        }
      }else{
        
        try {
          const collection = firestore()
            .collection('deviceInfos')
            .add(latestInfo)
            .then(() => {
              uploadImage();
              console.log('data added successfuly');
            });
        } catch (error) {
          console.log('Error uploading device info:', error);
        }

      }
    } else {
      await storeData(latestInfo);
      console.log('data stored successfuly', await getData());
    }
  };
  const storeData = async value => {
    try {
      const jsonValue = await JSON.stringify(value);
      await AsyncStorage.setItem('data', jsonValue);
    } catch (err) {
      console.log(err);
    }
  };
  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('data');
      return (await jsonValue) != null ? JSON.parse(jsonValue) : null;
    } catch (err) {
      console.log('getData', err);
    }
  };

  return (
    <RNCamera
      ref={cameraRef}
      style={styles.preview}
      type={RNCamera.Constants.Type.back}
      captureAudio={false}>
      <View style={styles.container}>
        <LogoContainer />
        <DateContainer dateTime={dateTime} />
        {capturedImage && <ImageContainer img={capturedImage} />}
        <InfoContainer text="Capture Count" value={captureCount} />
        <InfoContainer text="Frequency (min)" value={frequency} />
        <InfoContainer
          text="Connectivity"
          value={connectivityStatus ? 'Yes' : 'No'}
        />
        <InfoContainer
          text="Battery Charging"
          value={chargingStatus ? 'Yes' : 'No'}
        />
        <InfoContainer text="Battery Charge" value={batteryLevel} />
        <InfoContainer
          text="Location"
          value={location?.map(e => e).join(',  ')}
        />
        <CustomButton getInfos={uploadInfos} />
      </View>
    </RNCamera>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
  },
});
