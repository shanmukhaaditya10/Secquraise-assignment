import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import DeviceInfo from 'react-native-device-info';


const InfoContainer = ({text,value}) => {
  return (
    <View style={styles.container}>
      <Text style={{color:"white"}}>{text}</Text>
      <Text style={{color:"green"}}>{value}</Text>
    </View>
  )
}


const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        alignItems:"center",
        flexDirection:"row",
        width:"100%",
        paddingVertical:10,
        paddingLeft:10,
        paddingRight:10,
    
    }
})

export default InfoContainer
