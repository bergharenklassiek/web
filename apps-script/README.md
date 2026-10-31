# Reservations (Google Sheet)

Reservations made on the website are stored in a Google Sheet by the script in `reservations.gs`. The script also emails the guest a confirmation. Replies to that email go to bergharenklassiek@outlook.com.

## Setup

The script is deployed from this repository with [clasp](https://github.com/google/clasp), Google's command-line tool for Apps Script. The Dutch menu names are in brackets.

### 1. Create the Sheet and the web app (once)

1. Create a new Google Sheet with the Google account that should send the confirmation emails, for example `Reserveringen Bergharen Klassiek`.
2. In the Sheet, open **Extensions → Apps Script** (*Extensies → Apps Script*).
3. Click **Deploy → New deployment** (*Implementeren → Nieuwe implementatie*), choose type **Web app** and set:
   - **Execute as** (*Uitvoeren als*): Me
   - **Who has access** (*Wie heeft toegang*): Anyone (*Iedereen*)
4. Click **Deploy** and allow the permissions it asks for. The script needs to edit the Sheet and send email as you.

If you already deployed the script by hand, skip this step and use that deployment below. Later deploys from this repository keep these settings, because they're also in `appsscript.json`.

### 2. Connect this repository (once per computer)

1. Turn on the **Google Apps Script API** for your Google account at <https://script.google.com/home/usersettings>.
2. Run `npx clasp login` and log in with the same Google account in the browser.
3. In the Apps Script editor, open **Project Settings** (*Projectinstellingen*, gear icon) and copy the **Script ID** into `scriptId` in `apps-script/.clasp.json`.
4. Open **Deploy → Manage deployments** (*Implementeren → Implementaties beheren*) and copy the **Deployment ID** (*Implementatie-ID*) into `config.sheetDeploymentId` in `package.json`.
5. Put the web app URL, `https://script.google.com/macros/s/<Deployment ID>/exec`, into `reservationEndpoint` in `src/app/core/config/reservation.config.ts`.

Until the Script ID is filled in, `npm run sheet:push` stops with "Project settings not found". Until `reservationEndpoint` is filled in, the website keeps using the old "reserve by email" link.

### 3. Deploy

```sh
npm run sheet:deploy
```

This uploads `reservations.gs` and `appsscript.json` (`npm run sheet:push`) and publishes them as a new version of the existing deployment, so the web app URL stays the same. The deployment description is the current git commit, so you can see which code is live under **Manage deployments**.

The first push replaces the code in the Apps Script project, including any `Code.gs` you pasted in by hand. From then on this repository is the source: change the script here, not in the online editor, or the next deploy overwrites your change.

To check the deployment, open the web app URL in a browser. It should show `{"status":"ok"}`.

## Using the Sheet

The script creates two tabs on the first reservation:

- **Reserveringen:** one row per reservation, with the time received, concert, concert date, name, email address, number of people and **Event ID**.
- **Concerten:** one row per concert, with its **Capaciteit**, the total number of reserved seats and its **Event ID**. Every concert gets a capacity of 100 (`DEFAULT_CAPACITY` in the script), which you can change per concert here. An empty cell also counts as 100. Once a concert is full, the website tells guests there are no seats left, or how many are still available.

All counting is done by **Event ID**, the Storyblok ID of the concert. Unlike the title or the web address, it never changes, so renaming a concert in Storyblok doesn't affect its count. Don't edit the Event ID cells.

The script finds columns by their header, so you can reorder or add columns. Don't rename the headers. If a column is missing, for example in a spreadsheet made with an older version of the script, the script adds it at the end. Reservations made before the Event ID column existed have no ID and aren't counted.

The **Gereserveerd** totals are written by the script, not by a formula. They update after every reservation and whenever the spreadsheet is opened. You can also update them from the **Reserveringen → Aantallen bijwerken** menu. That menu appears a few seconds after the spreadsheet opens.

To cancel a reservation, delete its row in **Reserveringen**. The seats become available on the website straight away, because the script counts the rows on every reservation. To see the new total in **Concerten**, use **Reserveringen → Aantallen bijwerken**.

## Changing the script

Edit `reservations.gs` in this repository and run `npm run sheet:deploy`. Use `npm run sheet:push` to upload without publishing, for example to try a change in the Apps Script editor first.

Don't create a *new* deployment for a change: it gets a new URL, which would then also need changing on the website.

## Limits

A free Google account can send about 100 emails a day. A Google Workspace account can send about 1,500.
