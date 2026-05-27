import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getGradeInfo } from '../constants/grades';

interface Props {
  grade: string;
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function GradeBadge({ grade, percentage, size = 'md' }: Props) {
  const info = percentage !== undefined
    ? getGradeInfo(percentage)
    : { grade, label: '', textColor: '#FFF', bgColor: '#555' };

  const dim = size === 'sm' ? 32 : size === 'lg' ? 56 : 44;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 20 : 15;

  return (
    <View style={[styles.badge, { backgroundColor: info.bgColor, width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[styles.text, { color: info.textColor, fontSize }]}>{grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
