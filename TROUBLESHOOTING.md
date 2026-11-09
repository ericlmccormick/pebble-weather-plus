# Weather+ troubleshooting and data validation

Applies to the Weather+ **1.0.0** plugin source and its Pebble phone-side weather interface.

## No weather shown in Timeline WX

1. Confirm Weather+ is installed and configured in the Pebble mobile app.
2. Select **Weather+** as Timeline WX's provider. Built-in Timeline WX weather providers are a separate fallback route.
3. Verify the selected Weather+ location mode: GPS needs phone location access; fixed location needs a valid city/ZIP query.
4. Test **Automatic** or **Open-Meteo** as the provider before debugging provider-specific keys and coverage.
5. Generate a fresh diagnostic report from Weather+ settings where available, and redact private location or keys before sharing.

## Missing properties versus broken data

Weather+ can expose a 216-hour / nine-day forecast, but individual properties may be unavailable from a provider. A null field means *not supplied or not valid*, not a numeric zero. Coverage checks report scalar/series fields and populated/missing slots. Provider-specific alerts, marine and air quality fields may be absent based on geographical or feed limitations.

Validation checks structure, types, ranges and plausible relationships. A result of **zero validation errors** does not prove that the forecast is meteorologically accurate. The only way to validate forecast accuracy independently is to compare with separate observations or sources over time.

## Alerts

A successful weather fetch does not guarantee an active alert. Treat an explicit empty alert collection as **no currently reported alerts from that source**, not proof that no alerts exist anywhere. If a provider fails or does not support the region, alert status is **unknown/unavailable**, not a verified empty list. Avoid displaying an alert from missing or malformed data.

## Provider issues

Open-Meteo, MET Norway, NWS and OpenWeather differ in geographic coverage and optional products. OpenWeather requires appropriate credentials/plan access. For failures include the selected provider, plugin version, request stage and sanitized diagnostic details. Refresh after changing provider settings; cached responses may remain available for up to 15 minutes.

Do not include private coordinates, full location history, access tokens or API keys in public GitHub issues.
