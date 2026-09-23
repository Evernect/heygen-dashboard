# Caption fonts

The caption burner reads its fonts from this directory rather than from the
system, so a Windows dev machine and a Linux container render identically.
libass is pointed here with the `ass` filter's `fontsdir` option.

```bash
npm run fonts:install            # fetch all 19
npm run fonts:install -- --force # re-download over what is here
npm run fonts:check              # report what is missing
```

The `.ttf` files are gitignored. This mirrors the caption-burner Dockerfile,
which downloaded its fonts at image build time rather than carrying them in the
source tree.

## What comes from where

| Family | Source | Why |
|---|---|---|
| Poppins ExtraBold | `google/fonts` | Same URL the Dockerfile used |
| Montserrat | `JulietaUla/Montserrat` | google/fonts has only the variable font now, and libass renders variable fonts at their default instance - `Montserrat[wght].ttf` would give Regular when asked for Black |
| Montserrat Alternates | `google/fonts` | Static files still published there |
| Noto Sans / Serif | `notofonts.github.io` | Static hinted TTFs |

Filenames must match `FONT_FILES` in
`src/services/captions/caption-constants.js` exactly - that map is what turns a
style's font family into a path.

Only the font a style actually names has to be present. The shipped default
style uses `poppins-extrabold`, so `Poppins-ExtraBold.ttf` is the one that
matters; the rest only come into play if a preset is switched.

All three families are under the SIL Open Font License, which requires the
licence to travel with the fonts. `fonts:install` fetches the `OFL-*.txt` files
alongside them.
