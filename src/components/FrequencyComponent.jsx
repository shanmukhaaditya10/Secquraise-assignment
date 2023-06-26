import { StyleSheet, Text, TextInput, View } from 'react-native'
import React from 'react'

const FrequencyComponent = ({text,frequency,setFrequency}) => {
  return (
    <View style={styles.container}>
      <Text style={{color:"white"}} >{text}</Text>
      <TextInput style={{color:"green",height:30,width:30,borderWidth:1,borderColor:"#fff",padding:0,textAlign:"center"}} 
      keyboardType='numeric'
      defaultValue='15'
      onChangeText={(e)=>{
        setTimeout(()=>{
            setFrequency(e)

        },3000)
        }} >
      </TextInput>
    </View>
  )
}

export default FrequencyComponent

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