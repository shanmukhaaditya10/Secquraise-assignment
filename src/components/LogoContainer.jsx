import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const LogoContainer = () => {
  return (
    <View  >
    <Image source={require('../assets/logo.png')}
resizeMode='contain'
style={{width:220}}
    />
    </View>
  )
}

export default LogoContainer

const styles = StyleSheet.create({})