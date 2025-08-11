
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useUserLocation } from '@/hooks/use-user-location';
import { LocationGate } from '@/components/location-gate';
import { PageHeader } from '@/components/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SlidersHorizontal, Search } from 'lucide-react';
import { type Court, type Sport, type User } from '@/lib/types';
import { SPORTS, SPORT_ICONS } from '@/lib/constants';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { getFriendsAction } from '@/lib/actions';
import { CreateOpenChallengeDialog } from '@/components/challenges/create-open-challenge-dialog';

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


export default function CourtsMapPage() {
  const { latitude, longitude, error: locationError, loading: locationLoading, enableLocation, manualLocation, setManualLocation } = useUserLocation();
  const { user } = useAuth();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [radius, setRadius] = useState(5);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (user) {
      getFriendsAction(user.uid).then(setFriends);
    }
  }, [user]);

  const handleSearch = useCallback(() => {
    if (!mapInstanceRef.current || !placesServiceRef.current) return;
    
    setIsFetching(true);
    setFetchError(null);
    
    const currentCenter = mapInstanceRef.current.getCenter();
    if (!currentCenter) {
      setIsFetching(false);
      return;
    }

    const keywords = selectedSports.length > 0 ? selectedSports.map(s => `${s} court`).join(' OR ') : 'sports court';
    const request: google.maps.places.PlaceSearchRequest = {
      location: currentCenter,
      radius: radius * 1000,
      keyword: keywords,
    };
  
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      setIsFetching(false);
      setIsFilterPanelOpen(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const formattedCourts: Court[] = results
            .filter(place => place.place_id && place.name && place.geometry?.location)
            .map(place => ({
              id: place.place_id!,
              name: place.name!,
              location: {
                latitude: place.geometry!.location!.lat(),
                longitude: place.geometry!.location!.lng(),
              },
              supportedSports: selectedSports,
              address: place.vicinity,
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          }));
          setCourts(formattedCourts);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        setCourts([]);
      } else {
        setFetchError(`Failed to fetch courts. Status: ${status}`);
      }
    });
  }, [radius, selectedSports]);

  const handleManualSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!manualCity || !mapInstanceRef.current) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: manualCity }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            mapInstanceRef.current!.setCenter(results[0].geometry.location);
            mapInstanceRef.current!.setZoom(12);
            handleSearch();
        } else {
            setFetchError(`Could not find location: ${manualCity}`);
        }
    });
  }

  useEffect(() => {
    if (!apiKey) {
      setFetchError("Google Maps API key is missing.");
      return;
    }
  
    const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places', 'geocoding'] });
  
    loader.load().then(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 51.5072, lng: -0.1276 }, // Default center
          zoom: 12,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapId: 'rackt_map',
        });
        mapInstanceRef.current = map;
        placesServiceRef.current = new google.maps.places.PlacesService(map);
  
        // Once map is ready, if location is available, use it.
        if (latitude && longitude) {
          map.setCenter({ lat: latitude, lng: longitude });
          handleSearch();
        }
      }
    }).catch(e => {
      console.error("Failed to load Google Maps", e);
      setFetchError("Failed to load Google Maps. Please check your API key and network connection.");
    });
  }, [apiKey, latitude, longitude, handleSearch]);

  useEffect(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    if (mapInstanceRef.current && courts.length > 0) {
      courts.forEach(court => {
        const marker = new google.maps.Marker({
          position: { lat: court.location.latitude, lng: court.location.longitude },
          map: mapInstanceRef.current,
          title: court.name,
        });

        marker.addListener('click', () => {
            if (infoWindowRef.current) infoWindowRef.current.close();
            const challengeButtonHtml = user ? `<a href="/challenges" id="challenge-btn-${court.id}" class="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md text-sm px-3 py-1.5 text-center inline-flex items-center">Challenge</a>` : '';
            const mapsButtonHtml = court.url ? `<a href="${court.url}" target="_blank" rel="noopener noreferrer" class="text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 font-medium rounded-md text-sm px-3 py-1.5 text-center inline-flex items-center">View on Maps</a>` : '';
            
            const infoWindowContent = `<div class="p-2 space-y-2 max-w-xs font-sans"><h3 class="font-bold">${court.name}</h3>${court.address ? `<p class="text-sm text-gray-500">${court.address}</p>` : ''}<div class="flex items-center gap-2">${court.supportedSports.map(sport => `<img src="${SPORT_ICONS[sport]}" alt="${sport}" width="20" height="20" title="${sport}" />`).join('')}</div><div class="flex gap-2 items-center mt-2">${challengeButtonHtml}${mapsButtonHtml}</div></div>`;
            const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
            infoWindow.open(mapInstanceRef.current, marker);
            infoWindowRef.current = infoWindow;
        });
        newMarkers.push(marker);
      });
      markersRef.current = newMarkers;
    }

    return () => {
        newMarkers.forEach(m => m.setMap(null));
    }
  }, [courts, user]);


  if (locationLoading && !manualLocation) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
            <LoadingSpinner className="h-8 w-8" />
            <p className="mt-4 text-muted-foreground">Getting your location...</p>
        </div>
    );
  }

  if (!latitude && !longitude && !manualLocation) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader title="Find Courts" description="Search for nearby courts." />
        <LocationGate
          title="Enable location to find nearby courts."
          onEnable={enableLocation}
          onManual={setManualLocation}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
        <div className="p-4 md:p-6 lg:p-8">
            <PageHeader title="Find Courts" description="Discover nearby courts and see who's playing." />
        </div>
        <div className="flex-1 relative">
            {!apiKey ? (
                 <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Google Maps API key is missing.</p>
                </div>
            ) : (
                <div ref={mapRef} className="w-full h-full" />
            )}
            
            {manualLocation && courts.length === 0 && !isFetching && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-10">
                    <form onSubmit={handleManualSearch} className="flex gap-2 items-center bg-background p-2 rounded-lg shadow-lg">
                        <Input value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="Enter a city or address..." />
                        <Button type="submit"><Search className="h-4 w-4" /></Button>
                    </form>
                </div>
            )}

            {!isFilterPanelOpen && (
                 <Button onClick={() => setIsFilterPanelOpen(true)} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-lg">
                    <SlidersHorizontal className="mr-2" />
                    Filters
                </Button>
            )}

            {isFilterPanelOpen && mapInstanceRef.current && (
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
             {locationError && !manualLocation && (
                <Alert variant="destructive" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto">
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
             )}
             {fetchError && (
                 <Alert variant="destructive" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto">
                    <AlertTitle>Search Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
             )}
        </div>
    </div>
  );
}
