import React, {useEffect, useRef, useState} from 'react';
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
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import FrequencyComponent from './components/FrequencyComponent';

const Main = () => {
  const [capturedImage, setCapturedImage] = useState();
  const [chargingStatus, setChargingStatus] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [location, setLocation] = useState(null);
  const [connectivityStatus, setConnectivityStatus] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const [dateTime, setDateTime] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [frequency, setFrequency] = useState(15);
  // setting up device
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef(null);

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
    // requests
    requestCameraPermission();
    requestLocationPermission();
    // runs when component mounts
    uploadInfos();

    // keeps running according to frequency
    const intervalId = setInterval(async () => {
      uploadInfos();
    }, frequency * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [connectivityStatus, frequency]);


  const getDateTime = () => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}-${
      currentDate.getMonth() + 1
    }-${currentDate.getFullYear()}`;
    const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
    const formattedDateTime = `${formattedDate}   ${formattedTime}`;
    setDateTime(formattedDateTime);
  };
  // Responsible for all the info refresh as well as image capturing
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
    await handleCapture();
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
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });
      setCapturedImage(`file://${photo.path}`);
      console.log('capturedImage', photo.path);
    } catch (error) {
      handleCapture();
      console.log('waiting for camera...');
    }
  };
  // uploads based on connectivity
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
    if (connectivityStatus) {
      let data = await getData();
      //stores the data that is already in async to firebase
      if (data) {
        try {
          const collection = firestore()
            .collection('deviceInfos')
            .add(data)
            .then(() => {
              uploadImage();
              console.log('data added successfuly');
              //clears the data in async storage once uploaded to firebase
              AsyncStorage.clear();
            });
        } catch (error) {
          console.log('Error uploading device info:', error);
        }
      } else {
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
      // add to firebase if there is no internet connection
      await storeData(latestInfo);
      console.log('data stored successfuly', await getData());
    }
  };
  // Stores data in async storage
  const storeData = async value => {
    try {
      const jsonValue = await JSON.stringify(value);
      await AsyncStorage.setItem('data', jsonValue);
    } catch (err) {
      console.log(err);
    }
  };
  // Retrieves data from async storage
  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('data');
      return (await jsonValue) != null ? JSON.parse(jsonValue) : null;
    } catch (err) {
      console.log('getData', err);
    }
  };
  if (device == null) {
    // checks if device is available
    return <></>;
  } else {
    return (
      <>
        <Camera
          style={styles.preview}
          device={device}
          isActive={true}
          ref={camera}
          photo={true}></Camera>
        <View style={styles.container}>
          <LogoContainer />
          <DateContainer dateTime={dateTime} />
          {capturedImage && <ImageContainer img={capturedImage} />}
          <InfoContainer text="Capture Count" value={captureCount} />
          {/* contains text input */}
          <FrequencyComponent
            text="Frequency (min)"
            frequency={frequency}
            setFrequency={setFrequency}
          />
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
          <CustomButton uploadInfos={uploadInfos} />
        </View>
      </>
    );
  }
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  preview: {},
});
