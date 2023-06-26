import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const CustomButton = ({uploadInfos}) => {
  return (
    <TouchableOpacity style={{backgroundColor: '#006666', padding: 10, borderRadius: 7, width: '90%',alignItems:"center",justifyContent:"center",marginTop:20}}onPress={uploadInfos}>
        <Text style={{color: 'white'}}>Manual Data Refresh</Text>
    </TouchableOpacity>
  )
}

export default CustomButton

const styles = StyleSheet.create({})