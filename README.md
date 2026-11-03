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
- [ ] Set up end-to-end tests with Playwright and add the [scenarios](#end-to-end-test-scenarios) below.

### Fixes

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

End-to-end tests will use [Playwright](https://playwright.dev), which isn't set up yet. They cover what the unit tests can't see, because those run in jsdom instead of a real browser.

### End-to-end test scenarios

Tick a scenario in the PR that adds its test. Scenarios marked "fixed concerts" depend on which concerts exist, so they need test data instead of the live Storyblok content.

**Pages and navigation**

- [ ] Every menu page opens through the menu and by direct URL, with the right title and no console errors.
- [ ] The menu opens and closes, and closes by itself after choosing a page.
- [ ] The logo leads back to the home page.
- [ ] An old `/events/<concert>` link redirects to `/agenda/<concert>`.
- [ ] An unknown URL returns status 404 and the site's own page, with working links to the agenda and home page.
- [ ] An unknown concert shows "Dit concert konden we niet vinden", with a link to the agenda.

**Home page**

- [ ] Clicking a concert card opens that concert's page (fixed concerts).
- [ ] One upcoming concert shows the "Volgend jaar zijn we er weer!" tile next to the card (fixed concerts).
- [ ] Several upcoming concerts show no tile, and no upcoming concerts show the "druk bezig met ons programma" message (fixed concerts).
- [ ] Clicking the video thumbnail loads the player from `youtube-nocookie.com`, and nothing loads from YouTube before that click, apart from the thumbnail.

**Agenda**

- [ ] "Binnenkort" is selected first, and the toggle switches between upcoming and past concerts.
- [ ] Clicking a row opens that concert's page.
- [ ] With one upcoming concert the tile shows under "Binnenkort" but not under "Eerder" (fixed concerts).
- [ ] Going from a concert page to the agenda doesn't flash the tile while the list loads (fixed concerts).

**Concert page**

- [ ] An upcoming concert has a "Reserveer nu" button, and a past concert doesn't (fixed concerts).
- [ ] The route link and the Google Agenda link point to the right place and time.
- [ ] "Apple of Outlook" downloads a valid `.ics` file with the right time.
- [ ] "Eerder bij Bergharen Klassiek" lists earlier concerts by the same artists (fixed concerts).

**Carousels**

- [ ] On a concert page and on Gebouw, the carousel works by direct URL and when reached through the menu: all photos, dots and autoplay.
- [ ] Clicking a dot shows that photo.
- [ ] Loading the page causes no layout shift.

**Reservations** (the `script.google.com` request is answered by the test, so nothing reaches the real Sheet)

- [ ] "Reserveer hier" shows the list of concerts, choosing one opens the form, and "Alle concerten" goes back.
- [ ] "Reserveer nu" on a concert page opens the form for that concert straight away, without a back button.
- [ ] Empty fields and an invalid email address show an error, and no request is sent.
- [ ] A valid form sends the right data, shows the button as busy while sending, and then shows the thanks message with the number of people, the email address, and the route and calendar links.
- [ ] The answer "full" shows the seats left, or "Dit concert is helaas vol" when there are none.
- [ ] The answer "invalid" asks to check the details.
- [ ] A failed request shows an error with a working "reserveer per e-mail" link.
- [ ] The hidden honeypot field isn't visible and can't be reached with the keyboard.
- [ ] "Sluiten" closes the dialog.

**Keyboard**

- [ ] The menu, the agenda toggle and the video can be used with only the keyboard.
- [ ] The reservation dialog keeps focus inside, closes with Escape, and returns focus to the button that opened it.

**Phones and browsers**

- [ ] No page scrolls sideways at 390 px.
- [ ] With two cards on the home page, the first card stays reachable by swiping.
- [ ] The main scenarios also pass in WebKit (Safari), which no PR has been tested in so far.

**Security and search engines**

- [ ] No page causes a Content Security Policy violation, including when playing the video and sending a reservation.
- [ ] Prerendered and server-rendered pages all send the security headers.
- [ ] `/sitemap.xml` lists the pages and concerts, and every listed URL opens.
- [ ] Every page has its own title and description, and a concert page has its structured data.

**Accessibility**

- [ ] An automated check (axe) finds no serious problems on any page, or in the reservation dialog.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
