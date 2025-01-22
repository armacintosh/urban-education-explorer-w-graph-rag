import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Institution } from '../types/institution';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MarkerLayerProps {
  institutions: Institution[];
  onInstitutionSelect: (institution: Institution) => void;
  onViewDetails: (institution: Institution) => void;
}

function MarkerLayer({ institutions, onInstitutionSelect, onViewDetails }: MarkerLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (institutions.length > 0) {
      const bounds = L.latLngBounds(
        institutions.map(inst => [inst.latitude, inst.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [institutions, map]);

  const formatPercent = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return value.toLocaleString();
  };

  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
      {institutions.map((institution) => (
        <Marker
          key={institution.unitid}
          position={[institution.latitude, institution.longitude]}
          eventHandlers={{
            click: () => onInstitutionSelect(institution),
          }}
        >
          <Popup className="custom-popup" maxWidth={400} autoPan={false}>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-1">{institution.inst_name}</h3>
              <p className="text-gray-600 text-sm mb-3">{institution.inst_alias}</p>
              
              <div className="space-y-4">
                <Section title="Admission Statistics">
                  <InfoRow label="Admission Rate" value={formatPercent(institution.admit_rate)} />
                  <InfoRow label="Yield Rate" value={formatPercent(institution.yield_rate)} />
                  <InfoRow label="Total Enrolled" value={formatNumber(institution.number_enrolled_total)} />
                </Section>

                <Section title="Financial Information">
                  <InfoRow label="Average Aid Amount" value={formatCurrency(institution.sum_average_amount)} />
                  <InfoRow label="Students Receiving Aid" value={formatPercent(institution.percent_of_students)} />
                </Section>

                <Section title="Demographics">
                  <InfoRow label="Middle Income Students" value={formatPercent(institution.midincome_pct)} />
                </Section>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(institution);
                }}
                className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
              >
                View Full Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-700 mb-1">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface MapProps {
  institutions: Institution[];
  onInstitutionSelect: (institution: Institution) => void;
  onViewDetails?: (institution: Institution) => void;
}

export default function Map({ institutions, onInstitutionSelect, onViewDetails }: MapProps) {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <MarkerLayer 
        institutions={institutions}
        onInstitutionSelect={onInstitutionSelect}
        onViewDetails={(institution) => {
          if (onViewDetails) {
            onViewDetails(institution);
          }
        }}
      />
    </MapContainer>
  );
}