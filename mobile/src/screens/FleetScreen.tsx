// src/screens/FleetScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { getVehicles, deleteVehicle, updateVehicle, createVehicle } from '../services/api';
import { StatusBadge, Card, Button, EmptyState, LoadingScreen } from '../components';
import { Colors, Spacing, FontSize, Radius, VEHICLE_EMOJIS } from '../theme';
import VehicleModal from './modals/VehicleModal';
import Toast from 'react-native-toast-message';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }

const FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Available',   value: 'available' },
  { label: 'Rented',      value: 'rented' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function FleetScreen() {
  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editVehicle, setEditVehicle]   = useState<any>(null);

  const load = useCallback(async (f = filter) => {
    try {
      const data = await getVehicles(f || undefined) as any[];
      setVehicles(data);
    } catch (e: any) {
      Toast.show({ type:'error', text1:'Error', text2: e.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Vehicle', `Remove ${name} from fleet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteVehicle(id);
          Toast.show({ type:'success', text1:'Vehicle removed' });
          load();
        } catch (e: any) {
          Toast.show({ type:'error', text1: e.message });
        }
      }},
    ]);
  };

  const handleStatusCycle = async (v: any) => {
    const next: Record<string, string> = {
      available: 'maintenance', maintenance: 'available', rented: 'available',
    };
    Alert.alert('Change Status', `Set ${v.make} ${v.model} to "${next[v.status]}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await updateVehicle(v.id, { status: next[v.status] });
          Toast.show({ type:'success', text1:'Status updated' });
          load();
        } catch (e: any) {
          Toast.show({ type:'error', text1: e.message });
        }
      }},
    ]);
  };

  const handleSave = async (body: any) => {
    try {
      if (editVehicle) {
        await updateVehicle(editVehicle.id, body);
        Toast.show({ type:'success', text1:'Vehicle updated' });
      } else {
        await createVehicle(body);
        Toast.show({ type:'success', text1:'Vehicle added!' });
      }
      setModalVisible(false);
      setEditVehicle(null);
      load();
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    }
  };

  const filtered = vehicles.filter(v =>
    `${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(search.toLowerCase())
  );

  const renderVehicle = ({ item: v }: { item: any }) => (
    <Card style={styles.vehicleCard}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.vName}>{v.year} {v.make} {v.model}</Text>
          <View style={styles.platePill}>
            <Text style={styles.plateText}>{v.plate}</Text>
          </View>
        </View>
        <Text style={styles.emoji}>{VEHICLE_EMOJIS[v.type] || '🚗'}</Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Type</Text>
          <Text style={styles.metaVal}>{v.type}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Color</Text>
          <Text style={styles.metaVal}>{v.color || '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Daily Rate</Text>
          <Text style={[styles.metaVal, { color: Colors.accent }]}>{fmt(v.daily_rate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Status</Text>
          <StatusBadge status={v.status} />
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button title="Edit"   variant="outline" style={styles.actionBtn}
          onPress={() => { setEditVehicle(v); setModalVisible(true); }} />
        <Button title="Status" variant="ghost"   style={styles.actionBtn}
          onPress={() => handleStatusCycle(v)} />
        <Button title="Delete" variant="danger"  style={styles.actionBtn}
          onPress={() => handleDelete(v.id, `${v.make} ${v.model}`)} />
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicles..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.text3} />
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => { setFilter(f.value); load(f.value); }}>
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditVehicle(null); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={v => String(v.id)}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
        ListEmptyComponent={<EmptyState icon="🚗" message="No vehicles found" />} />

      <VehicleModal
        visible={modalVisible}
        vehicle={editVehicle}
        onClose={() => { setModalVisible(false); setEditVehicle(null); }}
        onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.surface2 },
  searchBar:      { flexDirection:'row', alignItems:'center', backgroundColor:Colors.surface,
                    margin:Spacing.lg, marginBottom:Spacing.sm, borderRadius:Radius.sm,
                    borderWidth:1, borderColor:Colors.border, paddingHorizontal:Spacing.md },
  searchIcon:     { fontSize:14, marginRight:6 },
  searchInput:    { flex:1, fontSize:FontSize.base, color:Colors.text, paddingVertical:10 },
  filters:        { flexDirection:'row', paddingHorizontal:Spacing.lg, gap:8,
                    marginBottom:Spacing.md, flexWrap:'wrap', alignItems:'center' },
  chip:           { paddingHorizontal:12, paddingVertical:5, borderRadius:Radius.full,
                    borderWidth:1, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipActive:     { backgroundColor:Colors.brand, borderColor:Colors.brand },
  chipText:       { fontSize:FontSize.sm, color:Colors.text2, fontWeight:'500' },
  chipTextActive: { color:'#fff' },
  addBtn:         { marginLeft:'auto', backgroundColor:Colors.accent, paddingHorizontal:14,
                    paddingVertical:6, borderRadius:Radius.sm },
  addBtnText:     { color:'#fff', fontSize:FontSize.sm, fontWeight:'600' },
  list:           { padding:Spacing.lg, paddingTop:0, gap:Spacing.sm, paddingBottom:40 },
  vehicleCard:    { padding:Spacing.md },
  cardTop:        { flexDirection:'row', alignItems:'flex-start', marginBottom:Spacing.md },
  vName:          { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  platePill:      { marginTop:4, backgroundColor:Colors.surface3, borderRadius:4,
                    paddingHorizontal:8, paddingVertical:2, alignSelf:'flex-start' },
  plateText:      { fontSize:FontSize.xs, fontWeight:'600', color:Colors.text2,
                    fontVariant:['tabular-nums'] },
  emoji:          { fontSize:36, marginLeft:Spacing.sm },
  metaGrid:       { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm,
                    borderTopWidth:1, borderTopColor:Colors.border,
                    paddingTop:Spacing.sm, marginBottom:Spacing.sm },
  metaItem:       { width:'48%', gap:2 },
  metaLabel:      { fontSize:FontSize.xs, color:Colors.text2 },
  metaVal:        { fontSize:FontSize.sm, fontWeight:'600', color:Colors.text },
  cardActions:    { flexDirection:'row', gap:Spacing.sm, borderTopWidth:1,
                    borderTopColor:Colors.border, paddingTop:Spacing.sm },
  actionBtn:      { flex:1, paddingVertical:7 },
});
