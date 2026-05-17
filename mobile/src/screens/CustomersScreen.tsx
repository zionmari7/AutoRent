// src/screens/CustomersScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput,
} from 'react-native';
import { getCustomers, createCustomer } from '../services/api';
import { Card, EmptyState, LoadingScreen, Avatar, Button } from '../components';
import { Colors, Spacing, FontSize, Radius, AVATAR_COLORS } from '../theme';
import CustomerModal from './modals/CustomerModal';
import Toast from 'react-native-toast-message';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }

export default function CustomersScreen() {
  const [customers, setCustomers]   = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCustomers() as any[];
      setCustomers(data);
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (body: any) => {
    try {
      await createCustomer(body);
      Toast.show({ type:'success', text1:`${body.first_name} added!` });
      setModalVisible(false);
      load();
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    }
  };

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderCustomer = ({ item: c, index }: { item: any; index: number }) => {
    const spent = Number(c.total_spent) || 0;
    const rents = Number(c.total_rentals) || 0;
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

    return (
      <Card style={styles.customerCard}>
        <View style={styles.cardTop}>
          <Avatar name={`${c.first_name} ${c.last_name}`} color={color} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.custName}>{c.first_name} {c.last_name}</Text>
            <Text style={styles.custInfo}>{c.email || '—'}</Text>
            <Text style={styles.custInfo}>{c.phone || '—'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{rents}</Text>
            <Text style={styles.statLabel}>Rentals</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statVal}>{fmt(spent)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{rents ? fmt(Math.round(spent / rents)) : '₱0'}</Text>
            <Text style={styles.statLabel}>Avg / Rental</Text>
          </View>
        </View>

        {c.license_no ? (
          <View style={styles.licenseBadge}>
            <Text style={styles.licenseText}>🪪 {c.license_no}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.text3} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.countText}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={c => String(c.id)}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
        ListEmptyComponent={<EmptyState icon="👤" message="No customers yet" />} />

      <CustomerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:Colors.surface2 },
  topRow:       { flexDirection:'row', margin:Spacing.lg, marginBottom:Spacing.sm,
                  gap:Spacing.sm, alignItems:'center' },
  searchBar:    { flex:1, flexDirection:'row', alignItems:'center',
                  backgroundColor:Colors.surface, borderRadius:Radius.sm,
                  borderWidth:1, borderColor:Colors.border, paddingHorizontal:Spacing.md },
  searchIcon:   { fontSize:14, marginRight:6 },
  searchInput:  { flex:1, fontSize:FontSize.base, color:Colors.text, paddingVertical:10 },
  addBtn:       { backgroundColor:Colors.accent, paddingHorizontal:14,
                  paddingVertical:10, borderRadius:Radius.sm },
  addBtnText:   { color:'#fff', fontSize:FontSize.sm, fontWeight:'600' },
  countText:    { fontSize:FontSize.sm, color:Colors.text2,
                  paddingHorizontal:Spacing.lg, marginBottom:Spacing.sm },
  list:         { padding:Spacing.lg, paddingTop:0, gap:Spacing.sm, paddingBottom:40 },
  customerCard: { padding:Spacing.md },
  cardTop:      { flexDirection:'row', alignItems:'center', marginBottom:Spacing.md },
  custName:     { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  custInfo:     { fontSize:FontSize.sm, color:Colors.text3, marginTop:1 },
  statsRow:     { flexDirection:'row', borderTopWidth:1, borderTopColor:Colors.border,
                  paddingTop:Spacing.sm },
  statItem:     { flex:1, alignItems:'center' },
  statBorder:   { borderLeftWidth:1, borderRightWidth:1, borderColor:Colors.border },
  statVal:      { fontSize:FontSize.lg, fontWeight:'700', color:Colors.text },
  statLabel:    { fontSize:FontSize.xs, color:Colors.text2, marginTop:2 },
  licenseBadge: { marginTop:Spacing.sm, backgroundColor:Colors.surface3,
                  borderRadius:Radius.sm, padding:Spacing.sm, alignSelf:'flex-start' },
  licenseText:  { fontSize:FontSize.xs, color:Colors.text2, fontWeight:'500' },
});
