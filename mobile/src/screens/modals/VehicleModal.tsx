// src/screens/modals/VehicleModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Modal, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Button } from '../../components';
import { Colors, Spacing, FontSize, Radius } from '../../theme';

const TYPES = ['Sedan', 'SUV', 'Hatchback', 'Van / MPV', 'Pickup'];
const STATUSES = ['available', 'rented', 'maintenance'];

export default function VehicleModal({ visible, vehicle, onClose, onSave }: any) {
  const [form, setForm] = useState({
    make:'', model:'', year:'', plate:'', type:'Sedan',
    color:'', daily_rate:'', status:'available',
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        make: vehicle.make, model: vehicle.model, year: String(vehicle.year),
        plate: vehicle.plate, type: vehicle.type, color: vehicle.color || '',
        daily_rate: String(vehicle.daily_rate), status: vehicle.status,
      });
    } else {
      setForm({ make:'', model:'', year:'', plate:'', type:'Sedan', color:'', daily_rate:'', status:'available' });
    }
  }, [vehicle, visible]);

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.title}>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ flex:1 }} contentContainerStyle={s.body}>
          <Row>
            <Field label="Make *" value={form.make} onChange={f('make')} placeholder="Toyota" />
            <Field label="Model *" value={form.model} onChange={f('model')} placeholder="Vios" />
          </Row>
          <Row>
            <Field label="Year *" value={form.year} onChange={f('year')} placeholder="2024" keyboardType="numeric" />
            <Field label="Plate *" value={form.plate} onChange={f('plate')} placeholder="ABC 1234" />
          </Row>
          <Row>
            <Field label="Daily Rate (₱) *" value={form.daily_rate} onChange={f('daily_rate')} placeholder="1500" keyboardType="numeric" />
            <Field label="Color" value={form.color} onChange={f('color')} placeholder="Pearl White" />
          </Row>
          <Text style={s.label}>Type</Text>
          <View style={s.chips}>
            {TYPES.map(t => (
              <TouchableOpacity key={t} style={[s.chip, form.type === t && s.chipActive]} onPress={() => f('type')(t)}>
                <Text style={[s.chipText, form.type === t && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Status</Text>
          <View style={s.chips}>
            {STATUSES.map(st => (
              <TouchableOpacity key={st} style={[s.chip, form.status === st && s.chipActive]} onPress={() => f('status')(st)}>
                <Text style={[s.chipText, form.status === st && s.chipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={s.footer}>
          <Button title="Cancel" variant="outline" style={{ flex:1 }} onPress={onClose} />
          <Button title="Save" variant="primary" style={{ flex:1 }} onPress={() =>
            onSave({ ...form, year: parseInt(form.year) || 2024, daily_rate: parseFloat(form.daily_rate) || 0 })} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ children }: any) {
  return <View style={{ flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.sm }}>{children}</View>;
}
function Field({ label, value, onChange, placeholder, keyboardType = 'default', style }: any) {
  return (
    <View style={[{ flex:1 }, style]}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={Colors.text3} keyboardType={keyboardType} />
    </View>
  );
}

const s = StyleSheet.create({
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                   padding:Spacing.lg, borderBottomWidth:1, borderBottomColor:Colors.border },
  title:         { fontSize:FontSize.lg, fontWeight:'700', color:Colors.text },
  close:         { fontSize:20, color:Colors.text3 },
  body:          { padding:Spacing.lg, paddingBottom:Spacing.xxl },
  footer:        { flexDirection:'row', gap:Spacing.sm, padding:Spacing.lg,
                   borderTopWidth:1, borderTopColor:Colors.border },
  label:         { fontSize:FontSize.sm, fontWeight:'600', color:Colors.text2,
                   marginBottom:5, marginTop:4 },
  input:         { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.sm,
                   padding:Spacing.sm, fontSize:FontSize.base, color:Colors.text,
                   backgroundColor:Colors.surface },
  chips:         { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm, marginBottom:Spacing.sm },
  chip:          { paddingHorizontal:12, paddingVertical:6, borderRadius:Radius.full,
                   borderWidth:1, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipActive:    { backgroundColor:Colors.brand, borderColor:Colors.brand },
  chipText:      { fontSize:FontSize.sm, color:Colors.text2 },
  chipTextActive:{ color:'#fff' },
});
