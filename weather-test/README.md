# Weather Source Test (experimental)

Diagnostic Pebble watch app for counting the data delivered by the weather plugin selected in the Pebble phone app.

## What it measures
- Number of populated scalar fields and series returned by `weather/location`.
- Total samples and non-null samples, hourly and daily series lengths, and non-null UV hours.
- Provider name, number of locations, and `last_fetched_at` when supported.
- Full field names and counts are written to phone logs as `WEATHER_TEST` JSON.

**Important:** This tests the Pebble source interface, **not** a feed forwarded through the stock Pebble Weather app. The stock app is another consumer, not a proxy. To compare different providers, change the selected weather plugin in Pebble's source preferences and reopen/recheck this app. The set of properties requested is the Weather+ superset; other plugins may reject unsupported fields. This is an initial diagnostic build, not a fully provider-independent capability discovery implementation.

Select on the watch re-subscribes. The selected plugin and its own caching rules determine whether this causes a new network fetch.

## Build
Requires Pebble SDK / Pebble CLI. From this directory run `pebble build`. The PBW will be under `build/`.

The experimental app lives only on branch `feature/weather-source-test-app` of `ericlmccormick/pebble-weather-plus`; it is not included in the production Weather+ plugin PBW.
