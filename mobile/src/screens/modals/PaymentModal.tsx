// src/screens/modals/PaymentModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Modal,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getRentals } from '../../services/api';
import { Button, LoadingScreen } from '../../components';
import { Colors, Spacing, FontSize, Radius } from '../../theme';

const METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Credit Card'];

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }

export default function PaymentModal({ visible, onClose, onSave }: any) {
  const [rentals, setRentals]   = useState<any[]>([]);
  const [rentalId, setRentalId] = useState('');
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('Cash');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (getRentals('active') as Promise<any[]>)
      .then(d => setRentals(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  const reset = () => {
    setRentalId(''); setAmount(''); setMethod('Cash'); setNotes('');
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
          <Text style={s.title}>Record Payment</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? <LoadingScreen /> : (
          <ScrollView contentContainerStyle={s.body}>
            <Text style={s.label}>Active Rental *</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={rentalId} onValueChange={setRentalId} style={s.picker}>
                <Picker.Item label="Select rental..." value="" />
                {rentals.map(r => (
                  <Picker.Item
                    key={r.id}
                    label={`#${r.id} — ${r.customer_name} · ${r.vehicle_name} (${fmt(r.total_amount)})`}
                    value={String(r.id)} />
                ))}
              </Picker>
            </View>

            <Text style={s.label}>Amount (₱) *</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="5000"
              keyboardType="numeric"
              placeholderTextColor={Colors.text3} />

            <Text style={s.label}>Payment Method</Text>
            <View style={s.methodGrid}>
              {METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.chip, method === m && s.chipActive]}
                  onPress={() => setMethod(m)}>
                  <Text style={[s.chipText, method === m && s.chipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Notes (optional)</Text>
            <TextInput
              style={s.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Full payment received"
              placeholderTextColor={Colors.text3} />
          </ScrollView>
        )}

        <View style={s.footer}>
          <Button title="Cancel" variant="outline" style={{ flex: 1 }}
            onPress={() => { reset(); onClose(); }} />
          <Button title="Record Payment" variant="primary" style={{ flex: 1 }}
            onPress={() => {
              onSave({
                rental_id: parseInt(rentalId),
                amount:    parseFloat(amount),
                method,
                notes,
              });
              reset();
            }} />
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
  methodGrid:    { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm, marginBottom:Spacing.sm },
  chip:          { paddingHorizontal:13, paddingVertical:7, borderRadius:Radius.full,
                   borderWidth:1, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipActive:    { backgroundColor:Colors.brand, borderColor:Colors.brand },
  chipText:      { fontSize:FontSize.sm, color:Colors.text2 },
  chipTextActive:{ color:'#fff' },
});
