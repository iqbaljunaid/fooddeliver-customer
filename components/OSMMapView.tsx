import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string; // hex color
}

export interface MapPolyline {
  coordinates: { latitude: number; longitude: number }[];
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type VehicleIcon = 'car' | 'motorcycle' | 'bicycle' | 'scooter';

interface OSMMapViewProps {
  style?: ViewStyle;
  region?: MapRegion;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  showsUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  userVehicleType?: VehicleIcon;
  followsUserLocation?: boolean;
  onMapReady?: () => void;
}

export default function OSMMapView({
  style,
  region,
  markers = [],
  polylines = [],
  showsUserLocation,
  userLocation,
  userVehicleType,
  followsUserLocation,
  onMapReady,
}: OSMMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const isReady = useRef(false);

  // Build the HTML with Leaflet
  const html = useMemo(() => {
    const center = region
      ? [region.latitude, region.longitude]
      : [40.7128, -74.006];
    const zoom = region
      ? Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.001))) + 1
      : 13;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${center[0]}, ${center[1]}], ${zoom});

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    var markers = {};
    var polylines = [];
    var userMarker = null;

    function createIcon(color) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">'
        + '<path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="' + color + '" stroke="#333" stroke-width="1"/>'
        + '<circle cx="12.5" cy="12.5" r="5" fill="white"/>'
        + '</svg>';
      return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -35]
      });
    }

    function makeVehicleHtml(svgContent, bgColor) {
      return '<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;'
        + 'background:' + bgColor + ';border-radius:50%;border:3px solid white;'
        + 'box-shadow:0 2px 8px rgba(0,0,0,0.35);">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">'
        + svgContent + '</svg></div>';
    }

    var vehicleSvgs = {
      car: makeVehicleHtml(
        '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>',
        '#4285F4'),
      motorcycle: makeVehicleHtml(
        '<path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>',
        '#FF6D00'),
      bicycle: makeVehicleHtml(
        '<path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5S3.07 13.5 5 13.5s3.5 1.57 3.5 3.5S6.93 20.5 5 20.5zm4.8-10.1L13 14v5h2v-6.2l-2.2-2.3 2-3c1.2 1.5 3.1 2.5 5.2 2.5v-2c-1.6 0-3-.8-3.8-2l-1.3-1.6c-.5-.6-1.1-.9-1.9-.9-.3 0-.5.1-.8.2L8 6.3V10h2V7.6l1.8-.9zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>',
        '#00C853'),
      scooter: makeVehicleHtml(
        '<path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z"/><path d="M5 6h5v2H5z"/><path d="M19 13c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>',
        '#9C27B0'),
      default: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>'
    };
    var currentVehicle = 'default';

    function getUserIcon(type) {
      var svg = vehicleSvgs[type] || vehicleSvgs['default'];
      var isVehicle = type && type !== 'default';
      return L.divIcon({
        html: svg,
        iconSize: isVehicle ? [44, 44] : [22, 22],
        iconAnchor: isVehicle ? [22, 22] : [11, 11],
        className: ''
      });
    }

    var userIcon = getUserIcon(currentVehicle);

    function updateMarkers(newMarkers) {
      // Remove old markers
      Object.keys(markers).forEach(function(id) {
        map.removeLayer(markers[id]);
        delete markers[id];
      });
      // Add new markers
      newMarkers.forEach(function(m) {
        var icon = createIcon(m.color || '#E74C3C');
        var marker = L.marker([m.latitude, m.longitude], { icon: icon });
        if (m.title) marker.bindPopup(m.title);
        marker.addTo(map);
        markers[m.id] = marker;
      });
    }

    function updatePolylines(newPolylines) {
      polylines.forEach(function(p) { map.removeLayer(p); });
      polylines = [];
      newPolylines.forEach(function(p) {
        var latlngs = p.coordinates.map(function(c) { return [c.latitude, c.longitude]; });
        var opts = {
          color: p.color || '#009DE0',
          weight: p.width || 3,
        };
        if (p.dashed) opts.dashArray = '10 5';
        var line = L.polyline(latlngs, opts).addTo(map);
        polylines.push(line);
      });
    }

    function updateUserLocation(lat, lng, vehicleType) {
      if (vehicleType && vehicleType !== currentVehicle) {
        currentVehicle = vehicleType;
        userIcon = getUserIcon(vehicleType);
        if (userMarker) userMarker.setIcon(userIcon);
      }
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      }
    }

    function setView(lat, lng, zoom) {
      map.setView([lat, lng], zoom);
    }

    function fitBounds(bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Listen for messages from React Native
    document.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'setView') setView(msg.lat, msg.lng, msg.zoom);
        if (msg.type === 'markers') updateMarkers(msg.data);
        if (msg.type === 'polylines') updatePolylines(msg.data);
        if (msg.type === 'userLocation') updateUserLocation(msg.lat, msg.lng, msg.vehicleType);
        if (msg.type === 'fitBounds') fitBounds(msg.bounds);
      } catch(err) {}
    });

    // Also handle window.addEventListener for Android WebView
    window.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'setView') setView(msg.lat, msg.lng, msg.zoom);
        if (msg.type === 'markers') updateMarkers(msg.data);
        if (msg.type === 'polylines') updatePolylines(msg.data);
        if (msg.type === 'userLocation') updateUserLocation(msg.lat, msg.lng, msg.vehicleType);
        if (msg.type === 'fitBounds') fitBounds(msg.bounds);
      } catch(err) {}
    });

    // Notify React Native that map is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>`;
  }, []); // Static HTML — updates happen via postMessage

  // Send markers to WebView
  useEffect(() => {
    if (!isReady.current) return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'markers', data: markers })
    );
  }, [markers]);

  // Send polylines to WebView
  useEffect(() => {
    if (!isReady.current) return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'polylines', data: polylines })
    );
  }, [polylines]);

  // Update user location
  useEffect(() => {
    if (!isReady.current || !showsUserLocation || !userLocation) return;
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'userLocation',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        vehicleType: userVehicleType,
      })
    );
  }, [userLocation, showsUserLocation, userVehicleType]);

  // Update view when region changes
  useEffect(() => {
    if (!isReady.current || !region) return;
    const zoom = Math.round(
      Math.log2(360 / Math.max(region.latitudeDelta, 0.001))
    ) + 1;
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'setView',
        lat: region.latitude,
        lng: region.longitude,
        zoom,
      })
    );
  }, [region]);

  // Follow user location
  useEffect(() => {
    if (!isReady.current || !followsUserLocation || !userLocation) return;
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'setView',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        zoom: 16,
      })
    );
  }, [followsUserLocation, userLocation]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        isReady.current = true;
        onMapReady?.();
        // Send initial data
        if (markers.length > 0) {
          webViewRef.current?.postMessage(
            JSON.stringify({ type: 'markers', data: markers })
          );
        }
        if (polylines.length > 0) {
          webViewRef.current?.postMessage(
            JSON.stringify({ type: 'polylines', data: polylines })
          );
        }
        if (showsUserLocation && userLocation) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'userLocation',
              lat: userLocation.latitude,
              lng: userLocation.longitude,
              vehicleType: userVehicleType,
            })
          );
        }
      }
    } catch {
      // ignore parse errors
    }
  };

  return (
    <WebView
      ref={webViewRef}
      style={[styles.map, style]}
      source={{ html }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
