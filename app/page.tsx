"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { Search, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SunArc from "./components/sunarc/sunarc";
import WindCompass from "./components/windcompass/windcompass";
import { describeWeatherCode } from "./lib/weathercodes";
import type {
  GeocodeResponse,
  GeocodeResult,
  ForecastResponse,
  TemperatureUnit,
  LoadStatus,
  UpcomingHour,
} from "./lib/type";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_CITY = "Kathmandu";

export default function Home() {
  const [query, setQuery] = useState<string>(DEFAULT_CITY);
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [weather, setWeather] = useState<ForecastResponse | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>("celsius");
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadCity = useCallback(
    async (cityName: string): Promise<void> => {
      setStatus("loading");
      setErrorMessage("");
      try {
        const geoRes = await fetch(
          `${GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) throw new Error("Location lookup failed.");
        const geoData = (await geoRes.json()) as GeocodeResponse;
        const match = geoData.results?.[0];
        if (!match) {
          setStatus("error");
          setErrorMessage(`No place found named "${cityName}". Check the spelling and try again.`);
          return;
        }

        const params = new URLSearchParams({
          latitude: String(match.latitude),
          longitude: String(match.longitude),
          current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
          hourly: "temperature_2m,weather_code,precipitation_probability",
          daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
          temperature_unit: unit,
          wind_speed_unit: "kmh",
          timezone: "auto",
          forecast_days: "6",
        });

        const wRes = await fetch(`${FORECAST_URL}?${params.toString()}`);
        if (!wRes.ok) throw new Error("Forecast lookup failed.");
        const wData = (await wRes.json()) as ForecastResponse;

        setPlace(match);
        setWeather(wData);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        const message = err instanceof Error ? err.message : "Something went wrong fetching the forecast.";
        setErrorMessage(message);
      }
    },
    [unit]
  );

  useEffect(() => {
    loadCity(DEFAULT_CITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (place) loadCity(place.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (query.trim()) loadCity(query.trim());
  }

  const unitLabel = unit === "celsius" ? "°C" : "°F";
  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;

  let upcomingHours: UpcomingHour[] = [];
  if (hourly && current) {
    const nowIso = current.time;
    const startIndex = hourly.time.findIndex((t) => t >= nowIso);
    const from = startIndex === -1 ? 0 : startIndex;
    upcomingHours = hourly.time.slice(from, from + 8).map((t, i) => ({
      time: t,
      temp: hourly.temperature_2m[from + i],
      code: hourly.weather_code[from + i],
      pop: hourly.precipitation_probability[from + i],
    }));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 pb-16">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-primary" aria-hidden="true">⟡</span>
          <div>
            <p className="font-display text-xl">Sky Panel</p>
            <p className="font-mono text-xs lowercase text-muted-foreground">an instrument reading for the sky</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-w-55 max-w-85 flex-1 gap-2">
          <label htmlFor="city-input" className="sr-only">Search for a city</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="city-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city…"
              autoComplete="off"
              className="pl-9"
            />
          </div>
          <Button type="submit">Locate</Button>
        </form>

        <div className="flex rounded-md border border-border overflow-hidden" role="group" aria-label="Temperature unit">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`rounded-none ${unit === "celsius" ? "bg-secondary text-foreground" : ""}`}
            onClick={() => setUnit("celsius")}
          >
            °C
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`rounded-none ${unit === "fahrenheit" ? "bg-secondary text-foreground" : ""}`}
            onClick={() => setUnit("fahrenheit")}
          >
            °F
          </Button>
        </div>
      </header>

      {/* Loading */}
      {status === "loading" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <Card className="border-primary/30">
          <CardContent className="py-5 font-mono text-sm text-primary">{errorMessage}</CardContent>
        </Card>
      )}

      {/* Ready */}
      {status === "ready" && current && place && daily && (
        <>
          <section className="mb-10 grid grid-cols-1 items-center gap-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {place.name}
                {place.admin1 ? `, ${place.admin1}` : ""}
                {place.country ? ` — ${place.country}` : ""}
              </p>
              <p className="font-display text-7xl font-medium leading-none md:text-8xl">
                {Math.round(current.temperature_2m)}
                <span className="ml-1 text-4xl text-muted-foreground">{unitLabel}</span>
              </p>
              <p className="mt-3 text-lg">{describeWeatherCode(current.weather_code)}</p>
              <p className="font-mono text-xs text-muted-foreground">
                Feels like {Math.round(current.apparent_temperature)}
                {unitLabel} · {current.relative_humidity_2m}% humidity
              </p>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-5 p-5">
                <div className="flex items-center gap-4">
                  <p className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Sun
                  </p>
                  <SunArc
                    sunrise={daily.sunrise[0]}
                    sunset={daily.sunset[0]}
                    now={current.time}
                    isDay={current.is_day === 1}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <p className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Wind
                  </p>
                  <WindCompass
                    speed={current.wind_speed_10m}
                    direction={current.wind_direction_10m}
                    unit="km/h"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Hourly */}
          <section className="mb-10" aria-label="Hourly forecast">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Next hours</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5">
              {upcomingHours.map((h) => (
                <Card key={h.time} className="min-w-19 shrink-0 text-center">
                  <CardContent className="p-3">
                    <p className="mb-2 font-mono text-[11px] text-muted-foreground">
                      {new Date(h.time).toLocaleTimeString([], { hour: "2-digit", hour12: false })}
                    </p>
                    <p className="font-display text-xl">{Math.round(h.temp)}°</p>
                    <Badge variant="secondary" className="mt-2 gap-1">
                      <Droplets className="h-3 w-3" />
                      {h.pop}%
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Daily */}
          <section aria-label="6-day forecast">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Six-day outlook</p>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {daily.time.map((date, i) => {
                  const max = daily.temperature_2m_max[i];
                  const min = daily.temperature_2m_min[i];
                  const dayLabel =
                    i === 0
                      ? "Today"
                      : new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "short" });
                  return (
                    <div key={date} className="grid grid-cols-[64px_1fr_48px_130px] items-center gap-3 px-5 py-3 text-sm">
                      <span className="font-mono text-xs">{dayLabel}</span>
                      <span className="text-muted-foreground">{describeWeatherCode(daily.weather_code[i])}</span>
                      <span className="flex items-center justify-end gap-1 font-mono text-xs text-teal">
                        <Droplets className="h-3 w-3" />
                        {daily.precipitation_probability_max[i]}%
                      </span>
                      <span className="flex items-center gap-2 font-mono text-xs">
                        <span className="w-7 text-muted-foreground">{Math.round(min)}°</span>
                        <span className="h-0.75 flex-1 rounded-full bg-linear-to-r from-muted-foreground to-primary" />
                        <span className="w-7">{Math.round(max)}°</span>
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <footer className="mt-8 font-mono text-[11px] text-muted-foreground">
            Data from Open-Meteo · Updated{" "}
            {new Date(current.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </footer>
        </>
      )}
    </main>
  );
}