
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useUserLocation } from '@/hooks/use-user-location';
import { findCourtsAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MapIcon, LocateFixed, X, Swords, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { type Court, type Sport } from '@/lib/types';
import { SPORTS, SPORT_ICONS } from '@/lib/constants';
import Image from 'next/image';
import { CreateOpenChallengeDialog } from '@/components/challenges/create-open-challenge-dialog';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

const FilterPanel = ({
  radius,
  setRadius,
  selectedSports,
  setSelectedSports,
  onApply,
  isFetching,
}: {
  radius: number;
  setRadius: (val: number) => void;
  selectedSports: Sport[];
  setSelectedSports: (sports: Sport[]) => void;
  onApply: () => void;
  isFetching: boolean;
}) => {
  return (
    <Card className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-10 shadow-lg animate-in fade-in-0 zoom-in-95">
      <CardContent className="p-4 space-y-4">
        <div>
            <label className="text-sm font-medium">Radius: {radius} km</label>
            <Slider
                value={[radius]}
                onValueChange={(val) => setRadius(val[0])}
                min={1}
                max={25}
                step={1}
            />
        </div>
        <div>
            <label className="text-sm font-medium">Sports</label>
            <ToggleGroup
                type="multiple"
                variant="outline"
                value={selectedSports}
                onValueChange={(value) => setSelectedSports(value as Sport[])}
                className="flex-wrap justify-start"
            >
                {SPORTS.map(sport => (
                    <ToggleGroupItem key={sport} value={sport} className="gap-2">
                        <Image src={SPORT_ICONS[sport]} alt={sport} width={16} height={16} unoptimized />
                        {sport}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
        <Button onClick={onApply} disabled={isFetching} className="w-full">
            {isFetching && <LoadingSpinner className="mr-2"/>}
            Search this area
        </Button>
      </CardContent>
    </Card>
  );
};

const CourtInfoWindow = ({ court, onClose }: { court: Court, onClose: () => void }) => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <InfoWindow
            position={{ lat: court.location.latitude, lng: court.location.longitude }}
            onCloseClick={onClose}
        >
            <div className="p-2 space-y-2 max-w-xs">
                <h3 className="font-bold">{court.name}</h3>
                {court.address && <p className="text-sm text-muted-foreground">{court.address}</p>}
                <div className="flex items-center gap-2">
                    {court.supportedSports.map(sport => (
                        <Image key={sport} src={SPORT_ICONS[sport]} alt={sport} width={20} height={20} unoptimized title={sport} />
                    ))}
                </div>
                <div className="flex gap-2 items-center">
                    <CreateOpenChallengeDialog user={user} onChallengeCreated={() => {}}>
                        <Button size="sm">
                            <Swords className="mr-2" />
                            Post Challenge
                        </Button>
                    </CreateOpenChallengeDialog>
                    {court.url && (
                        <Button asChild size="sm" variant="outline">
                            <Link href={court.url} target="_blank" rel="noopener noreferrer">
                                View on Google Maps
                                <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </InfoWindow>
    );
};


export default function CourtsMapPage() {
  const { latitude, longitude, error: locationError, loading: locationLoading } = useUserLocation();
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [center, setCenter] = useState({ lat: 51.5072, lng: -0.1276 }); // Default to London
  const [zoom, setZoom] = useState(12);

  const [radius, setRadius] = useState(5);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      setCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handleSearch = useCallback(async () => {
    if (!center) return;
    setIsFetching(true);
    setFetchError(null);
    setSelectedCourt(null);
    try {
        const results = await findCourtsAction(center.lat, center.lng, radius, selectedSports);
        setCourts(results);
    } catch (e: any) {
        setFetchError(e.message || "Failed to fetch courts.");
    } finally {
        setIsFetching(false);
        setIsFilterPanelOpen(false);
    }
  }, [center, radius, selectedSports]);
  
  useEffect(() => {
    if (latitude && longitude) {
        handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude])

  const markers = useMemo(() => courts.map((court) => (
    <AdvancedMarker
        key={court.id}
        position={{ lat: court.location.latitude, lng: court.location.longitude }}
        onClick={() => setSelectedCourt(court)}
    />
  )), [courts]);

  if (locationLoading) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
            <LoadingSpinner className="h-8 w-8" />
            <p className="mt-4 text-muted-foreground">Getting your location...</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
        <div className="p-4 md:p-6 lg:p-8">
            <PageHeader title="Find Courts" description="Discover nearby courts and see who's playing." />
        </div>
        <div className="flex-1 relative">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <Map
                    center={center}
                    zoom={zoom}
                    onCenterChanged={(e) => setCenter(e.detail.center)}
                    onZoomChanged={(e) => setZoom(e.detail.zoom)}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId={'rackt_map'}
                >
                    {markers}
                    {selectedCourt && <CourtInfoWindow court={selectedCourt} onClose={() => setSelectedCourt(null)} />}
                </Map>
            </APIProvider>
            
            {!isFilterPanelOpen && (
                 <Button onClick={() => setIsFilterPanelOpen(true)} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-lg">
                    <SlidersHorizontal className="mr-2" />
                    Filters
                </Button>
            )}

            {isFilterPanelOpen && (
                <FilterPanel 
                    radius={radius}
                    setRadius={setRadius}
                    selectedSports={selectedSports}
                    setSelectedSports={setSelectedSports}
                    onApply={handleSearch}
                    isFetching={isFetching}
                />
            )}
            {courts.length === 0 && !isFetching && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background p-3 rounded-lg shadow-lg text-sm text-muted-foreground">
                    No courts found. Try expanding the radius.
                </div>
            )}
             {locationError && (
                <Alert variant="destructive" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto">
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )}
        </div>
    </div>
  );
}
