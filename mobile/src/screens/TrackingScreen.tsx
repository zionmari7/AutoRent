// src/screens/TrackingScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { getTracking, updateLocation } from '../services/api';
import { StatusBadge, Card, Button, LoadingScreen } from '../components';
import { Colors, Spacing, FontSize, Radius, VEHICLE_EMOJIS } from '../theme';
import Toast from 'react-native-toast-message';

// Lipa City, Batangas center
const LIPA_REGION = {
  latitude:       13.9400,
  longitude:      121.1640,
  latitudeDelta:  0.04,
  longitudeDelta: 0.04,
};

function trackColor(v: any) {
  if (v.status === 'maintenance') return Colors.yellow;
  if (v.speed_kph > 0)           return Colors.green;
  if (v.status === 'rented')     return Colors.blue;
  return Colors.text3;
}

export default function TrackingScreen() {
  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getTracking() as any[];
      setVehicles(data);
    } catch (e: any) {
      Toast.show({ type:'error', text1: e.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 15 s
    intervalRef.current = setInterval(load, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const flyTo = (v: any) => {
    setSelected(v);
    mapRef.current?.animateToRegion({
      latitude:       v.lat,
      longitude:      v.lng,
      latitudeDelta:  0.008,
      longitudeDelta: 0.008,
    }, 600);
  };

  // Simulate a location update (in production, GPS tracker sends this via API)
  const simulateMove = (v: any) => {
    Alert.alert(
      'Simulate Location',
      `Move ${v.make} ${v.model} to a random nearby location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', onPress: async () => {
          try {
            const lat = v.lat + (Math.random() - 0.5) * 0.006;
            const lng = v.lng + (Math.random() - 0.5) * 0.006;
            const speed = Math.random() > 0.5 ? Math.floor(Math.random() * 60 + 20) : 0;
            await updateLocation(v.id, { lat, lng, speed_kph: speed, address: 'Lipa City' });
            Toast.show({ type:'success', text1:'Location updated' });
            await load();
          } catch (e: any) {
            Toast.show({ type:'error', text1: e.message });
          }
        }},
      ]
    );
  };

  const moving      = vehicles.filter(v => v.speed_kph > 0).length;
  const parked      = vehicles.filter(v => v.speed_kph === 0 && v.status !== 'maintenance').length;
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Stat strip */}
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{vehicles.length}</Text>
          <Text style={styles.stripLabel}>Total</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.green }]}>{moving}</Text>
          <Text style={styles.stripLabel}>Moving</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.text2 }]}>{parked}</Text>
          <Text style={styles.stripLabel}>Parked</Text>
        </View>
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: Colors.yellow }]}>{maintenance}</Text>
          <Text style={styles.stripLabel}>Maint.</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={LIPA_REGION}
        showsUserLocation
        showsMyLocationButton>
        {vehicles.map(v => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat, longitude: v.lng }}
            onPress={() => setSelected(v)}
            pinColor={trackColor(v)}>
            <View style={[styles.pin, { borderColor: trackColor(v) }]}>
              <Text style={styles.pinEmoji}>{VEHICLE_EMOJIS[v.type] || '🚗'}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{v.make} {v.model}</Text>
                <Text style={styles.calloutPlate}>{v.plate}</Text>
                <Text style={styles.calloutInfo}>📍 {v.address || 'Unknown'}</Text>
                <Text style={styles.calloutInfo}>
                  🚀 {v.speed_kph > 0 ? `${v.speed_kph} km/h` : 'Parked'}
                </Text>
                {v.renter_name && <Text style={styles.calloutRenter}>👤 {v.renter_name}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Map legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.green,  label: 'Moving' },
          { color: Colors.blue,   label: 'Rented' },
          { color: Colors.text3,  label: 'Available' },
          { color: Colors.yellow, label: 'Maint.' },
        ].map(l => (
          <View key={l.label} style={styles.legItem}>
            <View style={[styles.legDot, { backgroundColor: l.color }]} />
            <Text style={styles.legText}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Selected vehicle detail card */}
      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{selected.year} {selected.make} {selected.model}</Text>
              <Text style={styles.detailPlate}>{selected.plate}</Text>
            </View>
            <StatusBadge status={selected.speed_kph > 0 ? 'moving' : 'parked'} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelected(null)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.detailLoc}>📍 {selected.address || 'Unknown location'}</Text>
          <Text style={styles.detailSpeed}>
            Speed: {selected.speed_kph > 0 ? `${selected.speed_kph} km/h` : 'Parked'}
          </Text>
          {selected.renter_name && (
            <Text style={styles.detailRenter}>👤 Rented by {selected.renter_name}</Text>
          )}
          <Button
            title="📍 Simulate Location Update"
            variant="outline"
            style={{ marginTop: Spacing.sm }}
            onPress={() => simulateMove(selected)} />
        </View>
      )}

      {/* Vehicle list */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}>
        {vehicles.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[styles.listItem, selected?.id === v.id && styles.listItemSelected]}
            onPress={() => flyTo(v)}>
            <Text style={styles.listEmoji}>{VEHICLE_EMOJIS[v.type] || '🚗'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{v.make} {v.model}</Text>
              <Text style={styles.listPlate}>{v.plate}</Text>
              <Text style={styles.listLoc} numberOfLines={1}>📍 {v.address || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[styles.speedPill,
                { backgroundColor: v.speed_kph > 0 ? '#dcfce7' : Colors.surface3 }]}>
                <Text style={[styles.speedText,
                  { color: v.speed_kph > 0 ? Colors.green : Colors.text2 }]}>
                  {v.speed_kph > 0 ? `${v.speed_kph} km/h` : 'Parked'}
                </Text>
              </View>
              <StatusBadge status={v.status} />
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:Colors.surface2 },
  strip:        { flexDirection:'row', backgroundColor:Colors.surface,
                  borderBottomWidth:1, borderBottomColor:Colors.border },
  stripItem:    { flex:1, alignItems:'center', padding:Spacing.sm,
                  borderRightWidth:1, borderRightColor:Colors.border },
  stripVal:     { fontSize:FontSize.xl, fontWeight:'700', color:Colors.text },
  stripLabel:   { fontSize:FontSize.xs, color:Colors.text2 },
  map:          { height: 280 },
  legend:       { flexDirection:'row', backgroundColor:Colors.surface, padding:Spacing.sm,
                  borderBottomWidth:1, borderBottomColor:Colors.border,
                  justifyContent:'center', gap:Spacing.md },
  legItem:      { flexDirection:'row', alignItems:'center', gap:4 },
  legDot:       { width:8, height:8, borderRadius:4 },
  legText:      { fontSize:FontSize.xs, color:Colors.text2 },
  pin:          { width:34, height:34, borderRadius:17, backgroundColor:Colors.surface,
                  borderWidth:2.5, alignItems:'center', justifyContent:'center',
                  shadowColor:'#000', shadowOpacity:0.2, shadowRadius:4, elevation:4 },
  pinEmoji:     { fontSize:16 },
  callout:      { backgroundColor:Colors.surface, borderRadius:Radius.md,
                  padding:Spacing.sm, minWidth:160, shadowColor:'#000',
                  shadowOpacity:0.15, shadowRadius:8, elevation:6 },
  calloutTitle: { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  calloutPlate: { fontSize:FontSize.xs, color:Colors.text2, fontWeight:'600', marginBottom:4 },
  calloutInfo:  { fontSize:FontSize.xs, color:Colors.text2, marginTop:2 },
  calloutRenter:{ fontSize:FontSize.xs, color:Colors.blue, marginTop:4, fontWeight:'500' },
  detailCard:   { backgroundColor:Colors.surface, margin:Spacing.sm,
                  borderRadius:Radius.md, padding:Spacing.md,
                  borderWidth:1, borderColor:Colors.border,
                  shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, elevation:4 },
  detailTop:    { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm, marginBottom:6 },
  detailName:   { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  detailPlate:  { fontSize:FontSize.xs, color:Colors.text2, fontWeight:'600' },
  detailLoc:    { fontSize:FontSize.sm, color:Colors.text2, marginBottom:2 },
  detailSpeed:  { fontSize:FontSize.sm, color:Colors.text2, marginBottom:2 },
  detailRenter: { fontSize:FontSize.sm, color:Colors.blue, fontWeight:'500' },
  closeBtn:     { padding:4 },
  closeBtnText: { fontSize:16, color:Colors.text3 },
  list:         { flex:1 },
  listItem:     { flexDirection:'row', alignItems:'center', gap:Spacing.sm,
                  backgroundColor:Colors.surface, padding:Spacing.md,
                  borderBottomWidth:1, borderBottomColor:Colors.border },
  listItemSelected: { backgroundColor:'#fff5f6', borderLeftWidth:3, borderLeftColor:Colors.accent },
  listEmoji:    { fontSize:24 },
  listName:     { fontSize:FontSize.base, fontWeight:'600', color:Colors.text },
  listPlate:    { fontSize:FontSize.xs, color:Colors.text2, fontWeight:'600' },
  listLoc:      { fontSize:FontSize.xs, color:Colors.text3, marginTop:1 },
  speedPill:    { paddingHorizontal:8, paddingVertical:3, borderRadius:Radius.full },
  speedText:    { fontSize:FontSize.xs, fontWeight:'600' },
});
