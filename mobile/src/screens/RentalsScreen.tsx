// src/screens/RentalsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { getRentals, completeRental, createRental, getVehicles, getCustomers } from '../services/api';
import { StatusBadge, Card, SectionHeader, EmptyState, LoadingScreen, Button } from '../components';
import { Colors, Spacing, FontSize, Radius } from '../theme';
import RentalModal from './modals/RentalModal';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }
function fmtDate(d: string) {
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
}

const FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Active',    value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export default function RentalsScreen() {
  const [rentals, setRentals]     = useState<any[]>([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async (f = filter) => {
    try {
      const data = await getRentals(f || undefined) as any[];
      setRentals(data);
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = (id: number, customer: string) => {
    Alert.alert('Complete Rental', `Mark ${customer}'s rental as done?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        try {
          await completeRental(id);
          Toast.show({ type:'success', text1:'Rental completed!' });
          load();
        } catch (e: any) {
          Toast.show({ type:'error', text1: e.message });
        }
      }},
    ]);
  };

  const handleSave = async (body: any) => {
    try {
      await createRental(body);
      Toast.show({ type:'success', text1:'Rental created!' });
      setModalVisible(false);
      load();
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    }
  };

  // Summary stats
  const active    = rentals.filter(r => r.status === 'active').length;
  const completed = rentals.filter(r => r.status === 'completed').length;
  const revenue   = rentals.reduce((s, r) => s + (r.amount_paid || 0), 0);

  const renderRental = ({ item: r }: { item: any }) => {
    const paid    = r.amount_paid || 0;
    const balance = r.total_amount - paid;
    return (
      <Card style={styles.rentalCard}>
        <View style={styles.rentalTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rentalId}>#{r.id}</Text>
            <Text style={styles.rentalCustomer}>{r.customer_name}</Text>
            <Text style={styles.rentalVehicle}>{r.vehicle_name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <StatusBadge status={r.status} />
            <Text style={styles.rentalAmount}>{fmt(r.total_amount)}</Text>
          </View>
        </View>

        <View style={styles.rentalMeta}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Start</Text>
            <Text style={styles.metaVal}>{fmtDate(r.start_date)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>End</Text>
            <Text style={styles.metaVal}>{fmtDate(r.end_date)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Paid</Text>
            <Text style={[styles.metaVal, { color: paid >= r.total_amount ? Colors.green : Colors.red }]}>
              {fmt(paid)}
            </Text>
          </View>
          {balance > 0 && (
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Balance</Text>
              <Text style={[styles.metaVal, { color: Colors.red }]}>{fmt(balance)}</Text>
            </View>
          )}
        </View>

        {r.status === 'active' && (
          <Button
            title="✓  Mark as Completed"
            variant="outline"
            style={{ marginTop: Spacing.sm }}
            onPress={() => handleComplete(r.id, r.customer_name)} />
        )}
      </Card>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Summary strip */}
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.blue }]}>{active}</Text>
          <Text style={styles.stripLabel}>Active</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{completed}</Text>
          <Text style={styles.stripLabel}>Completed</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{rentals.length}</Text>
          <Text style={styles.stripLabel}>Total</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.green }]}>{fmt(revenue)}</Text>
          <Text style={styles.stripLabel}>Revenue</Text>
        </View>
      </View>

      {/* Filters + add button */}
      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => { setFilter(f.value); load(f.value); }}>
            <Text style={[styles.chipText, filter === f.value && styles.chipActive && { color:'#fff' }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rentals}
        keyExtractor={r => String(r.id)}
        renderItem={renderRental}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
        ListEmptyComponent={<EmptyState icon="📄" message="No rentals found" />} />

      <RentalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, backgroundColor:Colors.surface2 },
  strip:      { flexDirection:'row', backgroundColor:Colors.surface,
                borderBottomWidth:1, borderBottomColor:Colors.border },
  stripItem:  { flex:1, alignItems:'center', padding:Spacing.md,
                borderRightWidth:1, borderRightColor:Colors.border },
  stripVal:   { fontSize:FontSize.xl, fontWeight:'700', color:Colors.text },
  stripLabel: { fontSize:FontSize.xs, color:Colors.text2, marginTop:2 },
  filtersRow: { flexDirection:'row', paddingHorizontal:Spacing.lg,
                paddingVertical:Spacing.sm, gap:8, alignItems:'center' },
  chip:       { paddingHorizontal:12, paddingVertical:5, borderRadius:Radius.full,
                borderWidth:1, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipActive: { backgroundColor:Colors.brand, borderColor:Colors.brand },
  chipText:   { fontSize:FontSize.sm, color:Colors.text2, fontWeight:'500' },
  addBtn:     { marginLeft:'auto', backgroundColor:Colors.accent,
                paddingHorizontal:14, paddingVertical:6, borderRadius:Radius.sm },
  addBtnText: { color:'#fff', fontSize:FontSize.sm, fontWeight:'600' },
  list:       { padding:Spacing.lg, paddingTop:Spacing.sm, gap:Spacing.sm, paddingBottom:40 },
  rentalCard: { padding:Spacing.md },
  rentalTop:  { flexDirection:'row', marginBottom:Spacing.sm },
  rentalId:   { fontSize:FontSize.xs, color:Colors.text3, fontWeight:'600' },
  rentalCustomer: { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  rentalVehicle:  { fontSize:FontSize.sm, color:Colors.text2 },
  rentalAmount:   { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  rentalMeta: { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm,
                borderTopWidth:1, borderTopColor:Colors.border, paddingTop:Spacing.sm },
  metaCol:    { width:'48%' },
  metaLabel:  { fontSize:FontSize.xs, color:Colors.text2 },
  metaVal:    { fontSize:FontSize.sm, fontWeight:'600', color:Colors.text, marginTop:1 },
});
