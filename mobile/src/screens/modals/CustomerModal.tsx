// src/screens/modals/CustomerModal.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Modal,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Button } from '../../components';
import { Colors, Spacing, FontSize, Radius } from '../../theme';

export default function CustomerModal({ visible, onClose, onSave }: any) {
  const [fn, setFn]           = useState('');
  const [ln, setLn]           = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [license, setLicense] = useState('');
  const [address, setAddress] = useState('');

  const reset = () => {
    setFn(''); setLn(''); setEmail('');
    setPhone(''); setLicense(''); setAddress('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.title}>Add Customer</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>First Name *</Text>
              <TextInput style={s.input} value={fn} onChangeText={setFn}
                placeholder="Juan" placeholderTextColor={Colors.text3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Last Name *</Text>
              <TextInput style={s.input} value={ln} onChangeText={setLn}
                placeholder="dela Cruz" placeholderTextColor={Colors.text3} />
            </View>
          </View>

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="juan@email.com" keyboardType="email-address"
            placeholderTextColor={Colors.text3} />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            placeholder="+63 917 000 0000" keyboardType="phone-pad"
            placeholderTextColor={Colors.text3} />

          <Text style={s.label}>Driver's License No.</Text>
          <TextInput style={s.input} value={license} onChangeText={setLicense}
            placeholder="N01-00-000000" placeholderTextColor={Colors.text3} />

          <Text style={s.label}>Address</Text>
          <TextInput style={s.input} value={address} onChangeText={setAddress}
            placeholder="Lipa City, Batangas" placeholderTextColor={Colors.text3} />
        </ScrollView>

        <View style={s.footer}>
          <Button title="Cancel" variant="outline" style={{ flex: 1 }}
            onPress={() => { reset(); onClose(); }} />
          <Button title="Save Customer" variant="primary" style={{ flex: 1 }}
            onPress={() => {
              onSave({ first_name: fn, last_name: ln, email, phone,
                       license_no: license, address });
              reset();
            }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
             padding:Spacing.lg, borderBottomWidth:1, borderBottomColor:Colors.border },
  title:   { fontSize:FontSize.lg, fontWeight:'700', color:Colors.text },
  close:   { fontSize:20, color:Colors.text3 },
  body:    { padding:Spacing.lg, paddingBottom:Spacing.xxl },
  footer:  { flexDirection:'row', gap:Spacing.sm, padding:Spacing.lg,
             borderTopWidth:1, borderTopColor:Colors.border },
  label:   { fontSize:FontSize.sm, fontWeight:'600', color:Colors.text2,
             marginBottom:5, marginTop:Spacing.sm },
  input:   { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.sm,
             padding:Spacing.sm, fontSize:FontSize.base, color:Colors.text,
             backgroundColor:Colors.surface, marginBottom:4 },
});
