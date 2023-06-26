import { StyleSheet, Text, View , Image} from 'react-native'
import React from 'react'

const ImageContainer = ({img}) => {
  return (
   
    <Image
    source={{ uri: img }}
    style={{
      width: 200,
      height: 200,
    }}/>

  )
}

export default ImageContainer

const styles = StyleSheet.create({})