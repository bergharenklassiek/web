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

### Tests and CI

- [x] Make `npm test` work, using Vitest.
- [x] Add CI that runs the build and tests on every PR.
- [x] Update the test instructions in this README, which still described Karma.

### Fixes

- [ ] Swiper: `npm audit` reports a critical issue. The fix needs a major upgrade to version 14.
- [x] Homepage video: it loads from `tube.rvere.com`, not YouTube. Find out who runs it, and replace it if it isn't ours.
- [ ] "Reserveer hier" button: it's a clickable `div`, so keyboard users can't reach it.
- [ ] Event page photos: every photo reuses the first photo's alt text.
- [ ] Add security headers, such as a Content Security Policy. Only HSTS is set now.
- [ ] Unknown URLs such as `/bestaat-niet` get a plain-text "Not found" instead of the site's own page.
- [ ] Carousels don't autoplay, although `swiperConfig` asks for it. Decide whether they should, then fix or remove the setting.
- [ ] Remove the `console.log` in `ContentService.homePage()`.
- [ ] `home-page.component.scss` is 99 bytes over its 2 kB budget.
- [ ] `site.webmanifest`: `name` and `short_name` are empty.
- [x] Event page template: remove the unused `@if (event)` block.

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

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
