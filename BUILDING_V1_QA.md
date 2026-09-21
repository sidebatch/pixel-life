# Building Redesign V1 QA

- PASS — home_cottage.png size ((300, 293))
- PASS — home_cottage.png transparency ((0, 255))
- PASS — carpenter_workshop.png size ((330, 318))
- PASS — carpenter_workshop.png transparency ((0, 255))
- PASS — legacy house refs removed
- PASS — building system present
- PASS — embedded building assets
- PASS — Building V1 HUD marker
- PASS — home door inside footprint ((6, 7))
- PASS — home approach outside footprint ((6, 8))
- PASS — home no water overlap (set())
- PASS — home no tree overlap (set())
- PASS — home no fixed-object overlap (set())
- PASS — workshop door inside footprint ((14, 7))
- PASS — workshop approach outside footprint ((14, 8))
- PASS — workshop no water overlap (set())
- PASS — workshop no tree overlap (set())
- PASS — workshop no fixed-object overlap (set())
- PASS — official docs remain 4 (4 files)
- PASS — Building Standard 1.0 documented

## Runtime note
- JavaScript syntax was checked with `node --check` and passed.
- The local headless Chromium process in this environment did not produce a screenshot reliably, so final visual/mobile interaction QA should be done on the user device.
- Building images are embedded in the HTML to reduce Android `content://downloads` relative-path failures.