# Changelog

## [2.0.0](https://github.com/doug-williamson/foliokit/compare/cms-ui-v1.1.0...cms-ui-v2.0.0) (2026-07-01)


### ⚠ BREAKING CHANGES

* **cms-ui:** ProfileAvatarComponent and ProfileAvatarSize are removed from @foliokit/cms-ui. Use @rhombuskit/core's RhombusAvatarComponent (<rhombus-avatar [src] [srcDark] [name] size>) instead.
* **cms-ui:** FolioThemeControlComponent is no longer exported from @foliokit/cms-ui.

### refactor

* **cms-ui:** drop dead Material FolioThemeControlComponent ([c39c143](https://github.com/doug-williamson/foliokit/commit/c39c143c7ddc6b9474243f220ad4b4b23b0b130e))
* **cms-ui:** replace ProfileAvatarComponent with rhombus-avatar ([8788dae](https://github.com/doug-williamson/foliokit/commit/8788daefb4a0a281b2f603b6513c01b734c6e8e1))


### Features

* **cms-ui:** add hasNav/frame passthrough to folio-app-shell ([136fe28](https://github.com/doug-williamson/foliokit/commit/136fe28b53f0a32a63ce2e41823b585f15acbdd6))
* **cms-ui:** harden folio-app-shell with hasNav/frame passthrough (Path A) ([da8b721](https://github.com/doug-williamson/foliokit/commit/da8b721e09d5ff4c6fdd5ecbde1b4fd2fe6e50a0))
* **cms-ui:** self-host fonts, design tokens, enterprise admin reskin ([0a7f9ed](https://github.com/doug-williamson/foliokit/commit/0a7f9ed711233c1029a718a517224b1ad21e1370))
* **rhombuskit:** adopt 1.9.0 and complete conformity sweep ([3b0ff81](https://github.com/doug-williamson/foliokit/commit/3b0ff81a0dd8db955caae1550d2196be66a1796c))
* **rhombuskit:** adopt 1.9.0 and complete conformity sweep ([58fc15b](https://github.com/doug-williamson/foliokit/commit/58fc15ba72f8ec9b0ac54b62b7a38be30553a2c7))
* **theming:** adopt [@rhombuskit](https://github.com/rhombuskit) 1.6.0 — native per-visitor palettes + finish icon migration ([12f96b1](https://github.com/doug-williamson/foliokit/commit/12f96b1dbbdb0b1a76839f067d851d10be24ce75))
* **theming:** adopt [@rhombuskit](https://github.com/rhombuskit) 1.6.0 native palettes (Editorial/Slate/Sandstone) ([51639ec](https://github.com/doug-williamson/foliokit/commit/51639ec56f492255892f4b4ef82b30310b6af229))
* **ui:** adopt [@rhombuskit](https://github.com/rhombuskit) v1.5.0 — rhombus-icon + motion tokens ([3885dfc](https://github.com/doug-williamson/foliokit/commit/3885dfcd36c63d17c5e5db7ab3d2ad6cca6ba861))
* **ui:** adopt [@rhombuskit](https://github.com/rhombuskit) v1.5.0 — rhombus-icon + motion tokens ([8d996e0](https://github.com/doug-williamson/foliokit/commit/8d996e0cc62200dfff11ebc40bacf368dbb08734))


### Bug Fixes

* **admin:** gating crash, unreadable buttons, social thumbnails + RhombusKit adoption ([b348fa4](https://github.com/doug-williamson/foliokit/commit/b348fa44c05d95abcd3b4010782e68261ee77fcc))

## [1.1.0](https://github.com/doug-williamson/foliokit/compare/cms-ui-v1.0.9...cms-ui-v1.1.0) (2026-06-11)


### Features

* adopt @rhombuskit/tokens for error color sourcing ([4cd1758](https://github.com/doug-williamson/foliokit/commit/4cd1758f9866adfd81cd564991dd0f15257c7e44))
* adopt rhombus-app-shell@0.6.0 (bump + admin & docs re-point) ([4ee9a15](https://github.com/doug-williamson/foliokit/commit/4ee9a15b6913eae28f01da327b68d665352dcd38))
* **analytics:** v1 post view tracking ([6d5b5a6](https://github.com/doug-williamson/foliokit/commit/6d5b5a68c4d73119455911bd20ef74ab1bb8a8e8))
* **analytics:** v1 post view tracking with plan-gated daily buckets ([31f4725](https://github.com/doug-williamson/foliokit/commit/31f4725377453988c55bd798149b34defc3197a1))
* **cms-ui:** add folio-theme-control 3-state theme menu; replace per-shell toggles ([9d0c824](https://github.com/doug-williamson/foliokit/commit/9d0c824130227230fe66d7330bb6c00620d170ba))
* **cms-ui:** add pre-paint theme init script, remove bootstrap migration shim ([9e42463](https://github.com/doug-williamson/foliokit/commit/9e42463d22f07ec487fb662ed4250e437e1860b7))
* **cms-ui:** adopt @rhombuskit/material-preset for additive M3 component tokens ([4ae23fc](https://github.com/doug-williamson/foliokit/commit/4ae23fc6533edab84f76135c739f27abdb279336))
* **cms-ui:** adopt @rhombuskit/material-preset for additive M3 component tokens ([18e75c3](https://github.com/doug-williamson/foliokit/commit/18e75c38cb9901a16f145ebefe953d808eeb0105))
* **cms-ui:** folio-theme-control 3-state theme menu; replace per-shell toggles ([f35dfc1](https://github.com/doug-williamson/foliokit/commit/f35dfc1239b47c87909a2bf52493f45164869b62))
* **cms-ui:** pre-paint theme init script + dependency-checks fix ([9faf403](https://github.com/doug-williamson/foliokit/commit/9faf403e651cc232e8a713fbd650bf18a9fe6c1b))
* **cms-ui:** re-export RhombusThemeService and theme types ([ff12d64](https://github.com/doug-williamson/foliokit/commit/ff12d649d3a6c639a46e67e0e08362e984687b13))
* **cms-ui:** source error colors from @rhombuskit/tokens ([e371e23](https://github.com/doug-williamson/foliokit/commit/e371e2347bc3b0876eaf776d2e524620df4daf75))
* **rhombuskit:** adopt v0.8.0 primitives/composites across docs + admin ([a2feeca](https://github.com/doug-williamson/foliokit/commit/a2feeca5423984a9eb272cf416ef58c64ea3ce45))
* **rhombuskit:** adopt v0.8.0 primitives/composites across docs + admin ([6507f15](https://github.com/doug-williamson/foliokit/commit/6507f152f46069eb15543fcafa7bf033d2537b5c))


### Bug Fixes

* **cms-ui:** convert blog About page (BlogAboutPageComponent) to anchor buttons; revert mistargeted AboutPageComponent edit ([270e30b](https://github.com/doug-williamson/foliokit/commit/270e30b2c7ae8297bd590c9d9d30605a2c84f4c7))
* **cms-ui:** ignore CSS-only and dev deps in dependency-checks ([ffc32bb](https://github.com/doug-williamson/foliokit/commit/ffc32bb16d2c2b938dccf50e38fe579983481c04))
* **cms-ui:** make Show all tag toggle readable ([1013146](https://github.com/doug-williamson/foliokit/commit/1013146c2432a9b119387f6f18eb41ac7943938f))
* **cms-ui:** pin links-row chevron right via iconPositionEnd + auto margin ([f5f5093](https://github.com/doug-williamson/foliokit/commit/f5f509341231ffa4c2f3df43c090be7dd1d77bbc))
