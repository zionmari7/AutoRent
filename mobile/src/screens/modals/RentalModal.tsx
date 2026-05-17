// src/screens/modals/RentalModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCustomers, getVehicles } from '../../services/api';
import { Button, LoadingScreen } from '../../components';
import { Colors, Spacing, FontSize, Radius } from '../../theme';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }

export default function RentalModal({ visible, onClose, onSave }: any) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId]   = useState('');
  const [startDate, setStartDate]   = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate]       = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([getCustomers(), getVehicles('available')])
      .then(([c, v]) => { setCustomers(c as any[]); setVehicles(v as any[]); })
      .finally(() => setLoading(false));
  }, [visible]);

  const selVehicle = vehicles.find(v => String(v.id) === vehicleId);
  const days = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
  const total = selVehicle ? days * selVehicle.daily_rate : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={s.header}>
        <Text style={s.title}>New Rental</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
      </View>
      {loading ? <LoadingScreen /> : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.label}>Customer *</Text>
          <View style={s.pickerWrap}>
            <Picker selectedValue={customerId} onValueChange={setCustomerId} style={s.picker}>
              <Picker.Item label="Select customer..." value="" />
              {customers.map(c => (
                <Picker.Item key={c.id} label={`${c.first_name} ${c.last_name}`} value={String(c.id)} />
              ))}
            </Picker>
          </View>

          <Text style={s.label}>Vehicle *</Text>
          <View style={s.pickerWrap}>
            <Picker selectedValue={vehicleId} onValueChange={setVehicleId} style={s.picker}>
              <Picker.Item label="Select vehicle..." value="" />
              {vehicles.map(v => (
                <Picker.Item key={v.id} label={`${v.year} ${v.make} ${v.model} (${v.plate}) — ${fmt(v.daily_rate)}/day`} value={String(v.id)} />
              ))}
            </Picker>
          </View>

          <View style={{ flexDirection:'row', gap:Spacing.sm }}>
            <View style={{ flex:1 }}>
              <Text style={s.label}>Start Date</Text>
              <Text style={s.dateBox}>{startDate}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.label}>End Date</Text>
              <Text style={s.dateBox}>{endDate}</Text>
            </View>
          </View>
          <Text style={s.hint}>(Edit dates in YYYY-MM-DD format)</Text>

          {total > 0 && (
            <View style={s.totalBox}>
              <Text style={s.totalLabel}>Estimated Total</Text>
              <Text style={s.totalVal}>{fmt(total)}</Text>
              <Text style={s.totalSub}>{days} day{days > 1 ? 's' : ''} × {fmt(selVehicle?.daily_rate)}</Text>
            </View>
          )}
        </ScrollView>
      )}
      <View style={s.footer}>
        <Button title="Cancel" variant="outline" style={{ flex:1 }} onPress={onClose} />
        <Button title="Create Rental" variant="primary" style={{ flex:1 }}
          onPress={() => onSave({ customer_id: parseInt(customerId), vehicle_id: parseInt(vehicleId), start_date: startDate, end_date: endDate })} />
      </View>
    </Modal>
  );
}

// ─── CustomerModal ────────────────────────────────────────────────────────────
import { TextInput } from 'react-native';

export function CustomerModal({ visible, onClose, onSave }: any) {
  const [fn, setFn]         = useState('');
  const [ln, setLn]         = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [license, setLicense] = useState('');
  const [address, setAddress] = useState('');

  const reset = () => { setFn(''); setLn(''); setEmail(''); setPhone(''); setLicense(''); setAddress(''); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.title}>Add Customer</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.body}>
          <View style={{ flexDirection:'row', gap:Spacing.sm }}>
            <View style={{ flex:1 }}>
              <Text style={s.label}>First Name *</Text>
              <TextInput style={s.input} value={fn} onChangeText={setFn} placeholder="Juan" placeholderTextColor={Colors.text3} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.label}>Last Name *</Text>
              <TextInput style={s.input} value={ln} onChangeText={setLn} placeholder="dela Cruz" placeholderTextColor={Colors.text3} />
            </View>
          </View>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="juan@email.com" keyboardType="email-address" placeholderTextColor={Colors.text3} />
          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+63 917 000 0000" keyboardType="phone-pad" placeholderTextColor={Colors.text3} />
          <Text style={s.label}>Driver's License No.</Text>
          <TextInput style={s.input} value={license} onChangeText={setLicense} placeholder="N01-00-000000" placeholderTextColor={Colors.text3} />
          <Text style={s.label}>Address</Text>
          <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="Lipa City, Batangas" placeholderTextColor={Colors.text3} />
        </ScrollView>
        <View style={s.footer}>
          <Button title="Cancel" variant="outline" style={{ flex:1 }} onPress={() => { reset(); onClose(); }} />
          <Button title="Save Customer" variant="primary" style={{ flex:1 }}
            onPress={() => { onSave({ first_name:fn, last_name:ln, email, phone, license_no:license, address }); reset(); }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── PaymentModal ─────────────────────────────────────────────────────────────
export function PaymentModal({ visible, onClose, onSave }: any) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalId, setRentalId] = useState('');
  const [amount, setAmount]   = useState('');
  const [method, setMethod]   = useState('Cash');
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);

  const METHODS = ['Cash','GCash','Maya','Bank Transfer'];

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    import('../../services/api').then(({ getRentals }) =>
      getRentals('active').then(d => setRentals(d as any[])).finally(() => setLoading(false))
    );
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.title}>Record Payment</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
        </View>
        {loading ? <LoadingScreen /> : (
          <ScrollView contentContainerStyle={s.body}>
            <Text style={s.label}>Rental *</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={rentalId} onValueChange={setRentalId} style={s.picker}>
                <Picker.Item label="Select rental..." value="" />
                {rentals.map(r => (
                  <Picker.Item key={r.id} label={`#${r.id} — ${r.customer_name} · ${r.vehicle_name}`} value={String(r.id)} />
                ))}
              </Picker>
            </View>
            <Text style={s.label}>Amount (₱) *</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" placeholderTextColor={Colors.text3} />
            <Text style={s.label}>Payment Method</Text>
            <View style={s.chips}>
              {METHODS.map(m => (
                <TouchableOpacity key={m} style={[s.chip, method === m && s.chipActive]} onPress={() => setMethod(m)}>
                  <Text style={[s.chipText, method === m && s.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Notes (optional)</Text>
            <TextInput style={s.input} value={notes} onChangeText={setNotes} placeholder="Full payment received" placeholderTextColor={Colors.text3} />
          </ScrollView>
        )}
        <View style={s.footer}>
          <Button title="Cancel" variant="outline" style={{ flex:1 }} onPress={onClose} />
          <Button title="Record" variant="primary" style={{ flex:1 }}
            onPress={() => onSave({ rental_id: parseInt(rentalId), amount: parseFloat(amount), method, notes })} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
                   marginBottom:5, marginTop:Spacing.sm },
  input:         { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.sm,
                   padding:Spacing.sm, fontSize:FontSize.base, color:Colors.text,
                   backgroundColor:Colors.surface, marginBottom:4 },
  pickerWrap:    { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.sm,
                   backgroundColor:Colors.surface, marginBottom:4, overflow:'hidden' },
  picker:        { height:50, color:Colors.text },
  dateBox:       { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.sm,
                   padding:Spacing.sm, fontSize:FontSize.base, color:Colors.text,
                   backgroundColor:Colors.surface },
  hint:          { fontSize:FontSize.xs, color:Colors.text3, marginBottom:Spacing.sm },
  totalBox:      { backgroundColor:Colors.surface2, borderRadius:Radius.md,
                   padding:Spacing.md, alignItems:'center', marginTop:Spacing.sm },
  totalLabel:    { fontSize:FontSize.sm, color:Colors.text2 },
  totalVal:      { fontSize:FontSize.xxl, fontWeight:'700', color:Colors.accent, marginVertical:4 },
  totalSub:      { fontSize:FontSize.sm, color:Colors.text3 },
  chips:         { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm, marginBottom:Spacing.sm },
  chip:          { paddingHorizontal:12, paddingVertical:6, borderRadius:Radius.full,
                   borderWidth:1, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipActive:    { backgroundColor:Colors.brand, borderColor:Colors.brand },
  chipText:      { fontSize:FontSize.sm, color:Colors.text2 },
  chipTextActive:{ color:'#fff' },
});
