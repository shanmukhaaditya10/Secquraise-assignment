import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'

const DateContainer = ({dateTime}) => {
    
return (
    <View>
      <Text>{dateTime}</Text>
    </View>
  )
}

export default DateContainer

const styles = StyleSheet.create({})