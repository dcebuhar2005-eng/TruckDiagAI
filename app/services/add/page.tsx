"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic'

const SearchBox = dynamic(
  () =>
    import('@mapbox/search-js-react').then(
      (mod) => mod.SearchBox
    ),
  { ssr: false }
)
import Map, {
  Marker,
  NavigationControl,
  type MarkerDragEvent,
} from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

import { supabase } from "@/src/lib/supabase";
import { getLanguage, t } from "@/app/translations";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type MapViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

type MapboxFeature = {
  geometry?: {
    coordinates?: number[];
  };
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      place?: {
        name?: string;
      };
      locality?: {
        name?: string;
      };
    };
  };
};

type MapboxRetrieveResult = {
  features?: MapboxFeature[];
};

export default function AddServicePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [weekdayHours, setWeekdayHours] = useState("");
  const [saturdayHours, setSaturdayHours] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [findingLocation, setFindingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 45.3271,
    longitude: 14.4422,
    zoom: 6,
  });

  const currentLanguage = getLanguage();

  function extractCity(feature: MapboxFeature): string {
    const properties = feature.properties;
    const context = properties?.context;

    return (
      context?.place?.name ||
      context?.locality?.name ||
      properties?.name ||
      ""
    );
  }

  function extractAddress(feature: MapboxFeature): string {
    const properties = feature.properties;

    return (
      properties?.full_address ||
      properties?.place_formatted ||
      properties?.name ||
      addressValue
    );
  }

  function handleAddressChange(value: string) {
    setAddressValue(value);

    setLatitude(null);
    setLongitude(null);
    setLocationConfirmed(false);
  }

  function handleAddressRetrieve(result: MapboxRetrieveResult) {
    const feature = result.features?.[0];
    const coordinates = feature?.geometry?.coordinates;

    if (!feature || !coordinates || coordinates.length < 2) {
      alert(t("locationNotFound"));
      return;
    }

    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert(t("invalidLocation"));
      return;
    }

    const selectedAddress = extractAddress(feature);
    const selectedCity = extractCity(feature);

    setAddressValue(selectedAddress);

    if (selectedCity) {
      setCity(selectedCity);
    }

    setLatitude(lat);
    setLongitude(lng);
    setLocationConfirmed(true);

    setViewState({
      latitude: lat,
      longitude: lng,
      zoom: 15,
    });
  }

  function clearSelectedLocation() {
    setAddressValue("");
    setLatitude(null);
    setLongitude(null);
    setLocationConfirmed(false);
  }

  function handleMarkerDragEnd(event: MarkerDragEvent) {
    const lat = event.lngLat.lat;
    const lng = event.lngLat.lng;

    setLatitude(lat);
    setLongitude(lng);
    setLocationConfirmed(true);

    setViewState((current) => ({
      ...current,
      latitude: lat,
      longitude: lng,
    }));
  }

  function toggleVehicleType(type: string, checked: boolean) {
    setVehicleTypes((currentTypes) => {
      if (checked) {
        if (currentTypes.includes(type)) {
          return currentTypes;
        }

        return [...currentTypes, type];
      }

      return currentTypes.filter((vehicleType) => vehicleType !== type);
    });
  }

  async function reverseGeocode(lat: number, lng: number) {
    const params = new URLSearchParams({
      longitude: lng.toString(),
      latitude: lat.toString(),
      access_token: MAPBOX_TOKEN,
      language: currentLanguage,
    });

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(t("reverseGeocodeFailed"));
    }

    const data = await response.json();

    return (data.features?.[0] ?? null) as MapboxFeature | null;
  }

  function useMyLocation() {
    if (!MAPBOX_TOKEN) {
      alert(t("mapboxTokenMissing"));
      return;
    }

    if (!navigator.geolocation) {
      alert(t("locationUnsupported"));
      return;
    }

    setFindingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);
        setLocationConfirmed(true);

        setViewState({
          latitude: lat,
          longitude: lng,
          zoom: 16,
        });

        try {
          const feature = await reverseGeocode(lat, lng);

          if (feature) {
            const detectedAddress = extractAddress(feature);
            const detectedCity = extractCity(feature);

            if (detectedAddress) {
              setAddressValue(detectedAddress);
            }

            if (detectedCity) {
              setCity(detectedCity);
            }
          }
        } catch (error) {
          console.error(error);
          alert(t("reverseGeocodePartial"));
        } finally {
          setFindingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setFindingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          alert(t("locationPermissionDenied"));
          return;
        }

        alert(t("locationUnavailable"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }

  async function saveService() {
    if (saving) return;

    if (!MAPBOX_TOKEN) {
      alert(t("mapboxTokenMissing"));
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) {
      alert(`${t("userCheckError")} ${userError.message}`);
      return;
    }

    const user = userData.user;

    if (!user) {
      alert(t("mustLogin"));
      router.push("/login");
      return;
    }

    if (!name.trim()) {
      alert(t("serviceNameRequired"));
      return;
    }

    if (!addressValue.trim()) {
      alert(t("serviceAddressRequired"));
      return;
    }

    if (!city.trim()) {
      alert(t("cityRequired"));
      return;
    }

    if (
      !locationConfirmed ||
      latitude === null ||
      longitude === null
    ) {
      alert(t("locationRequired"));
      return;
    }

    if (vehicleTypes.length === 0) {
      alert(t("vehicleTypeRequired"));
      return;
    }

    const workingHours =
      `${t("weekdayLabel")}: ${weekdayHours.trim() || "-"}\n` +
      `${t("saturdayLabel")}: ${saturdayHours.trim() || "-"}`;

    setSaving(true);

    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      name: name.trim(),
      address: addressValue.trim(),
      city: city.trim(),
      phone: phone.trim(),
      working_hours: workingHours,
      description: description.trim(),
      vehicle_types: vehicleTypes,
      latitude,
      longitude,
    });

    setSaving(false);

    if (error) {
      alert(`${t("serviceSaveError")} ${error.message}`);
      return;
    }

    alert(t("serviceSaveSuccess"));

    router.push("/services");
    router.refresh();
  }

  const inputStyle = {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.42)",
    color: "white",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const sectionStyle = {
    marginBottom: "18px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
  };

  const checkboxCardStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        padding: "20px",
        paddingBottom: "140px",
        maxWidth: "780px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.58)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "22px",
          padding: "24px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ marginBottom: "26px" }}>
          <h1 style={{ margin: 0 }}>
            {t("addServiceTitle")}
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.5,
            }}
          >
            {t("addServiceSubtitle")}
          </p>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("serviceNameLabel")} *
          </label>

          <input
            placeholder={t("serviceName")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("serviceAddressLabel")} *
          </label>

          {MAPBOX_TOKEN ? (
            <SearchBox
              accessToken={MAPBOX_TOKEN}
              value={addressValue}
              onChange={handleAddressChange}
              onRetrieve={handleAddressRetrieve}
              onClear={clearSelectedLocation}
              placeholder={t("serviceAddressPlaceholder")}
              options={{
                language: currentLanguage,
                types: "address,street,place,poi",
              }}
            />
          ) : (
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(248,113,113,0.4)",
                color: "#fecaca",
              }}
            >
              {t("mapboxTokenMissing")}
            </div>
          )}

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              fontSize: "13px",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {t("serviceAddressHelp")}
          </p>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("cityLabel")} *
          </label>

          <input
            placeholder={t("city")}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("phoneLabel")}
          </label>

          <input
            type="tel"
            placeholder={t("phone")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: "28px", marginBottom: "18px" }}>
          <h3 style={{ marginBottom: "6px" }}>
            🕒 {t("workingHours")}
          </h3>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.55)",
              fontSize: "14px",
            }}
          >
            {t("workingHoursHelp")}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div>
            <label style={labelStyle}>
              {t("weekdayLabel")}
            </label>

            <input
              placeholder="08:00 - 17:00"
              value={weekdayHours}
              onChange={(event) =>
                setWeekdayHours(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              {t("saturdayLabel")}
            </label>

            <input
              placeholder="08:00 - 13:00"
              value={saturdayHours}
              onChange={(event) =>
                setSaturdayHours(event.target.value)
              }
              style={inputStyle}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("serviceDescriptionLabel")}
          </label>

          <textarea
            placeholder={t("serviceDescription")}
            rows={5}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginTop: "28px" }}>
          <h3 style={{ marginBottom: "7px" }}>
            🚘 {t("vehicleType")}
          </h3>

          <p
            style={{
              marginTop: 0,
              marginBottom: "14px",
              color: "rgba(255,255,255,0.55)",
              fontSize: "14px",
            }}
          >
            {t("vehicleTypeHelp")}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <label style={checkboxCardStyle}>
              <input
                type="checkbox"
                checked={vehicleTypes.includes("cars")}
                onChange={(event) =>
                  toggleVehicleType(
                    "cars",
                    event.target.checked
                  )
                }
              />

              <span>{t("car")}</span>
            </label>

            <label style={checkboxCardStyle}>
              <input
                type="checkbox"
                checked={vehicleTypes.includes("trucks")}
                onChange={(event) =>
                  toggleVehicleType(
                    "trucks",
                    event.target.checked
                  )
                }
              />

              <span>{t("truck")}</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                📍 {t("serviceLocationTitle")}
              </h3>

              <p
                style={{
                  marginTop: "5px",
                  marginBottom: 0,
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {t("serviceLocationHelp")}
              </p>
            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={findingLocation || !MAPBOX_TOKEN}
              style={{
                background: findingLocation
                  ? "#475569"
                  : "#2563eb",
                color: "white",
                border: "none",
                padding: "11px 16px",
                borderRadius: "11px",
                fontWeight: 700,
                cursor:
                  findingLocation || !MAPBOX_TOKEN
                    ? "not-allowed"
                    : "pointer",
                opacity: !MAPBOX_TOKEN ? 0.6 : 1,
              }}
            >
              {findingLocation
                ? t("findingLocation")
                : `📍 ${t("useCurrentLocation")}`}
            </button>
          </div>

          {latitude !== null && longitude !== null ? (
            <>
              <div
                style={{
                  height: "340px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border:
                    "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <Map
                  mapboxAccessToken={MAPBOX_TOKEN}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  latitude={viewState.latitude}
                  longitude={viewState.longitude}
                  zoom={viewState.zoom}
                  onMove={(event) =>
                    setViewState({
                      latitude: event.viewState.latitude,
                      longitude: event.viewState.longitude,
                      zoom: event.viewState.zoom,
                    })
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <NavigationControl position="top-right" />

                  <Marker
                    latitude={latitude}
                    longitude={longitude}
                    anchor="bottom"
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                  >
                    <div
                      title={t("dragMarkerTitle")}
                      style={{
                        fontSize: "38px",
                        lineHeight: 1,
                        cursor: "grab",
                        filter:
                          "drop-shadow(0 4px 5px rgba(0,0,0,0.45))",
                      }}
                    >
                      📍
                    </div>
                  </Marker>
                </Map>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  padding: "13px 15px",
                  borderRadius: "12px",
                  background: locationConfirmed
                    ? "rgba(22,163,74,0.14)"
                    : "rgba(245,158,11,0.14)",
                  border: locationConfirmed
                    ? "1px solid rgba(74,222,128,0.35)"
                    : "1px solid rgba(251,191,36,0.35)",
                  color: locationConfirmed
                    ? "#bbf7d0"
                    : "#fde68a",
                  fontWeight: 700,
                }}
              >
                {locationConfirmed
                  ? `✓ ${t("locationConfirmed")}`
                  : t("selectAddressFromSuggestions")}
              </div>
            </>
          ) : (
            <div
              style={{
                minHeight: "190px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                borderRadius: "18px",
                border:
                  "1px dashed rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {t("locationMapEmpty")}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={saveService}
          disabled={
            saving ||
            !locationConfirmed ||
            latitude === null ||
            longitude === null
          }
          style={{
            width: "100%",
            marginTop: "26px",
            background:
              saving ||
              !locationConfirmed ||
              latitude === null ||
              longitude === null
                ? "#4b5563"
                : "linear-gradient(180deg, #22c55e, #15803d)",
            color: "white",
            border: "none",
            padding: "15px 20px",
            borderRadius: "13px",
            fontSize: "16px",
            fontWeight: 800,
            cursor:
              saving ||
              !locationConfirmed ||
              latitude === null ||
              longitude === null
                ? "not-allowed"
                : "pointer",
            boxShadow:
              locationConfirmed && !saving
                ? "0 10px 25px rgba(22,163,74,0.25)"
                : "none",
          }}
        >
          {saving
            ? t("saving")
            : t("saveServiceBtn")}
        </button>
      </div>
    </div>
  );
}