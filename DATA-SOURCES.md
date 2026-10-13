# Country data and flag sources

The bundled catalog contains 250 countries, territories and other listed places. The **195 countries only** scope selects the 193 UN members plus Palestine and Vatican City (Holy See).

Country names, capitals, alternative names, and regional classifications are derived from [mledoze/countries](https://github.com/mledoze/countries), downloaded on 12 October 2026. The canonical derived dataset is data/countries.json and is made available under the [Open Database License 1.0](data/ODbL-1.0.txt). Attribution: mledoze/countries contributors. The database license applies to this data; it does not imply that every included place is an independent country.

Transformations: English common names; joined multiple capitals with " / "; a "No permanent capital" label for missing capitals; North/South America assigned from the source subregion; Antarctic renamed Antarctica; UN-member/observer filtering; capitals without source values excluded from Capital Quest. Regional grouping, capital/administrative-centre choices, and disputed-status entries follow the source snapshot. Data is educational and may require updates when governments or names change.

Flags are bundled from [Flagcdn](https://flagcdn.com), a service by [Flagpedia](https://flagpedia.net) based on Wikimedia Commons vector files. They are stored locally in browser/flags/. Android uses its system Unicode flag font.

To regenerate both catalogs after editing data/countries.json:

    node tools/sync-country-data.cjs

No network access is used by the Android application. The browser loads its images from the same GitHub Pages site. User scores remain on the device.
