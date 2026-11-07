# Weather+

Experimental seven-day phone-side Pebble weather plugin, built from the Timeline WX provider design.

## Data
Standard `weather/location` fields plus 168 hourly slots and seven daily slots. Forecasts use SI units, with missing readings represented as null. Locations follow Pebble's saved weather locations. Open-Meteo is primary; MET Norway and NWS are fallback providers. OpenWeather integration and configurable provider selection are planned.

## Build
Use Pebble SDK 4.44+ and pebble-tool 5.1+; run `pebble build`. Plugins are currently preview-only. Do not publish until API stabilizes.

## Status
0.1.0 initial implementation; not yet device-tested. NWS and MET Norway fallbacks are partial, and daily sunrise/sunset require Open-Meteo. Full 168-hour coverage is only provided when a source supplies it. Provider failures are logged.
