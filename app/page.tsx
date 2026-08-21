"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import SunArc from "./components/sunarc/sunarc";
import WindCompass from "./components/windcompass/windcompass";
import { describeWeatherCode } from "./lib/weathercodes/weathercodes";
import type {
  GeocodeResponse,
  GeocodeResult,
  ForecastResponse,
  TemperatureUnit,
  LoadStatus,
  UpcomingHour,
} from "./lib/weathercodes/types/types";

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
    if (place) {
      loadCity(place.name);
    }
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
    <main className="panel">
      <header className="panel-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">⟡</span>
          <div>
            <p className="brand-name">Sky Panel</p>
            <p className="brand-tag">an instrument reading for the sky</p>
          </div>
        </div>

        <form className="search" onSubmit={handleSubmit}>
          <label htmlFor="city-input" className="sr-only">Search for a city</label>
          <input
            id="city-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city…"
            autoComplete="off"
          />
          <button type="submit">Locate</button>
        </form>

        <div className="unit-toggle" role="group" aria-label="Temperature unit">
          <button type="button" className={unit === "celsius" ? "active" : ""} onClick={() => setUnit("celsius")}>°C</button>
          <button type="button" className={unit === "fahrenheit" ? "active" : ""} onClick={() => setUnit("fahrenheit")}>°F</button>
        </div>
      </header>

      {status === "loading" && <p className="status-line">Reading the sky…</p>}

      {status === "error" && (
        <div className="status-line status-error"><p>{errorMessage}</p></div>
      )}

      {status === "ready" && current && place && daily && (
        <>
          <section className="hero">
            <div className="hero-primary">
              <p className="hero-place">
                {place.name}
                {place.admin1 ? `, ${place.admin1}` : ""}
                {place.country ? ` — ${place.country}` : ""}
              </p>
              <p className="hero-temp">
                {Math.round(current.temperature_2m)}
                <span className="hero-unit">{unitLabel}</span>
              </p>
              <p className="hero-condition">{describeWeatherCode(current.weather_code)}</p>
              <p className="hero-feels">
                Feels like {Math.round(current.apparent_temperature)}
                {unitLabel} · {current.relative_humidity_2m}% humidity
              </p>
            </div>

            <div className="hero-instruments">
              <div className="instrument">
                <p className="instrument-label">Sun position</p>
                <SunArc sunrise={daily.sunrise[0]} sunset={daily.sunset[0]} now={current.time} isDay={current.is_day === 1} />
              </div>
              <div className="instrument">
                <p className="instrument-label">Wind</p>
                <WindCompass speed={current.wind_speed_10m} direction={current.wind_direction_10m} unit="km/h" />
              </div>
            </div>
          </section>

          <section className="hourly" aria-label="Hourly forecast">
            <p className="section-label">Next hours</p>
            <div className="hourly-strip">
              {upcomingHours.map((h) => (
                <div className="hour-card" key={h.time}>
                  <p className="hour-time">{new Date(h.time).toLocaleTimeString([], { hour: "2-digit", hour12: false })}</p>
                  <p className="hour-temp">{Math.round(h.temp)}°</p>
                  <p className="hour-pop">{h.pop}%</p>
                </div>
              ))}
            </div>
          </section>

          <section className="daily" aria-label="6-day forecast">
            <p className="section-label">Six-day outlook</p>
            <ul className="daily-list">
              {daily.time.map((date, i) => {
                const max = daily.temperature_2m_max[i];
                const min = daily.temperature_2m_min[i];
                const dayLabel = i === 0 ? "Today" : new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "short" });
                return (
                  <li className="daily-row" key={date}>
                    <span className="daily-day">{dayLabel}</span>
                    <span className="daily-condition">{describeWeatherCode(daily.weather_code[i])}</span>
                    <span className="daily-pop">{daily.precipitation_probability_max[i]}%</span>
                    <span className="daily-range">
                      <span className="daily-min">{Math.round(min)}°</span>
                      <span className="daily-bar" aria-hidden="true" />
                      <span className="daily-max">{Math.round(max)}°</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <footer className="panel-footer">
            <p>Data from Open-Meteo · Updated {new Date(current.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </footer>
        </>
      )}

      <style>{/* full CSS block — same as shown earlier, unchanged */}</style>
    </main>
  );
}