# BergharenKlassiek

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

## TODO

### Finish recent work

- [ ] Run `npm run sheet:deploy` from `main` to add the route, parking and calendar links to the confirmation email. This needs `npx clasp login` with the account that owns the script (see [apps-script/README.md](apps-script/README.md)).
- [ ] After that deploy, make one real test reservation: check the email and the calendar link (also on an iPhone), then delete the row from the Sheet.
- [ ] Submit `https://bergharenklassiek.nl/sitemap.xml` in Google Search Console.
- [ ] Test a concert page in Google's Rich Results Test.

### Content (Storyblok)

- [ ] Gebouw page: replace "maximaal 80 bezoekers", because the capacity is 120.
- [ ] Concerten in de regio: update the 2025 festival text, which is also used as the page's search description.

### Features

- [ ] Add a cancellation link to the confirmation email, so seats free up without someone editing the Sheet.
- [ ] Send a reminder email the day before a concert. A free Google account can send about 100 emails a day, so a full concert could hit that limit.
- [ ] Add a 1200×630 share image for pages without their own photo, which now share the wide logo.
- [x] Show a second tile on the home page and agenda page, when there is only one event coming up, saying we will be back next year

### Tests and CI

- [x] Make `npm test` work, using Vitest.
- [x] Add CI that runs the build and tests on every PR.
- [x] Update the test instructions in this README, which still described Karma.
- [x] Set up end-to-end tests with Playwright and add the [scenarios](#end-to-end-test-scenarios) below.

### Fixes

- [x] Carousel dots are too small to tap easily (axe rule `target-size`), on Gebouw and on concerts with several photos.
- [x] Swiper: `npm audit` reports a critical issue. The fix needs a major upgrade to version 14.
- [x] Homepage video: it loads from `tube.rvere.com`, not YouTube. Find out who runs it, and replace it if it isn't ours.
- [x] "Reserveer hier" button: it's a clickable `div`, so keyboard users can't reach it.
- [x] Event page photos: every photo reuses the first photo's alt text.
- [x] Add security headers, such as a Content Security Policy. Only HSTS is set now.
- [x] Unknown URLs such as `/bestaat-niet` get a plain-text "Not found" instead of the site's own page.
- [x] Carousels don't autoplay, although `swiperConfig` asks for it. Decide whether they should, then fix or remove the setting.
- [x] Remove the `console.log` in `ContentService.homePage()`.
- [x] `home-page.component.scss` is 99 bytes over its 2 kB budget.
- [x] `site.webmanifest`: `name` and `short_name` are empty.
- [x] Event page template: remove the unused `@if (event)` block.
- [x] Gebouw page only shows first photo
- [x] Try to improve accessibility score
- [x] Align non event pages with event page, with regards to image carousel

### Performance

- [x] Reduce the first load (745 kB, over the 500 kB budget).
  - [x] Load Swiper only on the pages that use it, not in `main.ts`.
  - [x] Remove NgRx DevTools from the production build.
  - [x] Move to one state library (NgRx Signals), instead of both NgRx Store and NgRx Signals.
  - [x] Replace Font Awesome's runtime with a small icon component.
- [x] Reduce the homepage HTML (140 kB, including 78 kB of inline CSS and 47 kB of embedded data).
- [x] Cache server-rendered concert pages on the CDN.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Tests run with [Vitest](https://vitest.dev), through Angular's unit test builder.

- `npm test`: run all tests once.
- `npm run test:watch`: run tests again when files change.
- `npm run test:coverage`: run all tests with a coverage report, in the terminal and in `coverage/`. This fails when coverage drops below the thresholds in `angular.json`.

`src/apps-script.spec.ts` tests the reservation script in `apps-script/reservations.gs` against a fake Sheet and Gmail. It can't show how Google's own services behave, so try a real reservation after deploying the script.

## Continuous integration

`.github/workflows/ci.yml` runs the tests with coverage thresholds and the build on every pull request and on `main`. The coverage table is shown in the run's summary, and the full report is attached to the run.

## Running end-to-end tests

End-to-end tests in `e2e/` use [Playwright](https://playwright.dev). They only cover what needs a real browser or server, such as layout, CSS, focus and server responses. Everything else belongs in the unit tests, which are faster and run in jsdom.

- `npx playwright install chromium webkit`: install the browsers, once.
- `npm run e2e`: start the site and run all tests in Chromium and WebKit.
- `npm run e2e:ui`: run tests in Playwright's interactive window.

CI runs them on every pull request and on `main`.

The tests run against the production build on Angular's server, with live content from Storyblok:

- Upcoming concerts and reservations are faked in the browser (`e2e/support/fake-concert.ts`). Nothing needs adding to Storyblok, and a test fails if a reservation request isn't answered by the test, so nothing reaches the real Sheet.
- Concert pages opened by URL are rendered on the server, where requests can't be faked. The carousel tests therefore need `/gebouw` and `/agenda/concert-dina-ivanova` to keep at least two photos each.
- Netlify isn't involved, so its headers for static files aren't tested here. A unit test keeps them the same as the server's headers.
- WebKit is close to Safari but isn't the same, and doesn't replace trying a real iPhone.

### End-to-end test scenarios

Tick a scenario in the PR that adds its test.

- [x] Every menu page opens through the menu and by direct URL, with the right content and no console errors.
- [x] An old `/events/<concert>` link redirects to `/agenda/<concert>`, and an unknown URL returns status 404 with the site's own page.
- [x] On a concert page and on Gebouw, the carousel works by direct URL and when reached through the menu: all photos, dots and autoplay.
- [x] Loading the pages causes no layout shift.
- [x] A full reservation works from the "Reserveer hier" button to the thanks message. The test answers the `script.google.com` request, so nothing reaches the real Sheet.
- [x] The honeypot field in the reservation form isn't visible.
- [x] The reservation dialog keeps focus inside, closes with Escape, and returns focus to the button that opened it.
- [x] No page scrolls sideways at 390 px, and with two cards on the home page the first one stays reachable by swiping.
- [x] No page causes a Content Security Policy violation, including when playing the video and sending a reservation.
- [x] The main flows also pass in WebKit (Safari).
- [x] An automated check (axe) finds no serious problems on any page, or in the reservation dialog.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
