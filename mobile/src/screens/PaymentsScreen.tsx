// src/screens/PaymentsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { getPayments, createPayment, getRentals } from '../services/api';
import { Card, EmptyState, LoadingScreen, Button } from '../components';
import { Colors, Spacing, FontSize, Radius } from '../theme';
import PaymentModal from './modals/PaymentModal';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }
function fmtDate(d: string) {
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
}

const METHOD_COLORS: Record<string, string> = {
  Cash:            '#f1f5f9',
  GCash:           '#dbeafe',
  Maya:            '#dcfce7',
  'Bank Transfer': '#fef9c3',
  'Credit Card':   '#f3e8ff',
};

export default function PaymentsScreen() {
  const [payments, setPayments]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPayments() as any[];
      setPayments(data);
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
      await createPayment(body);
      Toast.show({ type:'success', text1:'Payment recorded!' });
      setModalVisible(false);
      load();
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    }
  };

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  const renderPayment = ({ item: p }: { item: any }) => (
    <Card style={styles.payCard}>
      <View style={styles.payTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.payCustomer}>{p.customer_name}</Text>
          <Text style={styles.payVehicle}>{p.vehicle_name}</Text>
          <Text style={styles.payDate}>{fmtDate(p.paid_at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.payAmount}>{fmt(p.amount)}</Text>
          <View style={[styles.methodPill, { backgroundColor: METHOD_COLORS[p.method] || '#f1f5f9' }]}>
            <Text style={styles.methodText}>{p.method}</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Revenue strip */}
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.green }]}>{fmt(totalRevenue)}</Text>
          <Text style={styles.stripLabel}>Total Collected</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{payments.length}</Text>
          <Text style={styles.stripLabel}>Transactions</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Record</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments}
        keyExtractor={p => String(p.id)}
        renderItem={renderPayment}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
        ListEmptyComponent={<EmptyState icon="💳" message="No payments recorded" />} />

      <PaymentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, backgroundColor:Colors.surface2 },
  strip:      { flexDirection:'row', backgroundColor:Colors.surface,
                borderBottomWidth:1, borderBottomColor:Colors.border,
                padding:Spacing.md, alignItems:'center' },
  stripItem:  { flex:1, alignItems:'center' },
  stripVal:   { fontSize:FontSize.xl, fontWeight:'700', color:Colors.text },
  stripLabel: { fontSize:FontSize.xs, color:Colors.text2, marginTop:2 },
  addBtn:     { backgroundColor:Colors.accent, paddingHorizontal:16,
                paddingVertical:9, borderRadius:Radius.sm },
  addBtnText: { color:'#fff', fontSize:FontSize.sm, fontWeight:'600' },
  list:       { padding:Spacing.lg, gap:Spacing.sm, paddingBottom:40 },
  payCard:    { padding:Spacing.md },
  payTop:     { flexDirection:'row', alignItems:'flex-start' },
  payCustomer:{ fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  payVehicle: { fontSize:FontSize.sm, color:Colors.text2, marginTop:1 },
  payDate:    { fontSize:FontSize.xs, color:Colors.text3, marginTop:2 },
  payAmount:  { fontSize:FontSize.lg, fontWeight:'700', color:Colors.text },
  methodPill: { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full },
  methodText: { fontSize:FontSize.xs, fontWeight:'600', color:Colors.text2 },
});
