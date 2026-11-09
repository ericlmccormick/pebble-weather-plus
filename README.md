# Weather+ — shared Pebble weather plugin

**Current source version: 1.0.0** (`package.json`). Weather+ is a phone-side plugin offering normalized weather data to Pebble apps such as [Timeline WX](https://github.com/ericlmccormick/Pebble-Timeline-WX).

## What it provides

Weather+ supports configurable weather sources and location, a **216-hour / nine-day** forecast when provider data is available, optional air-quality and marine fields, local alerts, source diagnostics and a 15-minute cache. Available provider choices in the current code are Automatic, Open-Meteo, MET Norway, NWS and OpenWeather. Availability and completeness depend on country, requested field, and upstream service.

Supported temperature units: C/F/K/R. Supported wind units: m/s, km/h, mph, knots. Precipitation, pressure and visibility have configurable units. Missing measurements are explicitly null rather than estimated; a successful schema/plausibility check does **not** independently verify forecast accuracy.

## Install and configure

1. Install the Weather+ plugin PBW in the Pebble phone app and grant its requested permissions.
2. Open the plugin's settings. Choose automatic/GPS or fixed location and preferred providers, units, forecast model, air quality, marine and alert behavior.
3. Install an app which supports Weather+, such as Timeline WX, and select Weather+ as its source.
4. If a request fails, inspect the plugin's diagnostic report and the selected provider. Do not publish credentials or private location details from logs.

The Weather+ plugin owns weather settings when an app consumes it. Timeline WX's built-in weather options are a separate fallback path.

## Build

The repository contains the phone plugin at `src/plugin/index.js`, configuration page at `src/config.html`, and PBW packaging helper at `scripts/pack-plugin-pbw.py`. Use [GitHub Actions](.github/workflows/build-pbw.yml) for packaged builds or a compatible plugin-enabled Pebble SDK. The manifest's `weather` source category determines store discovery.

For error triage, alert semantics and missing data, see [Troubleshooting and validation](TROUBLESHOOTING.md).

## Limitations

Weather reports may include missing/null values. Provider outages, limited geographical coverage and unavailable alerts do not necessarily indicate a plugin fault. Local-alert validation distinguishes missing data from an explicit empty alert list where the provider makes this possible. Test with a real phone and watch; code-level validation alone does not prove every provider is operational.

## Support

Report the plugin version, selected provider/location mode, diagnostic stage and anonymized reproduction steps. Support development: https://ko-fi.com/ericmccormick
