// These types describe the exact shape of what the Open-Meteo APIs return.
// Writing them out means TypeScript will flag it immediately if we
// misspell a field (e.g. `temperture_2m`) or use the wrong type, instead
// of the mistake only showing up as `undefined` in the browser.

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface GeocodeResponse {
  results?: GeocodeResult[];
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: 0 | 1;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_probability_max: number[];
}

export interface ForecastResponse {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export type TemperatureUnit = "celsius" | "fahrenheit";

export type LoadStatus = "idle" | "loading" | "error" | "ready";

// A single flattened hour, built from the parallel arrays in HourlyWeather
// — much easier to pass around and render than four arrays kept in sync
// by index.
export interface UpcomingHour {
  time: string;
  temp: number;
  code: number;
  pop: number;
}