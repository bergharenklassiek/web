# Reservations (Google Sheet)

Reservations made on the website are stored in a Google Sheet by the script in `reservations.gs`. The script also emails the guest a confirmation, with the concert's date, time and location, a route link, a link to add it to their calendar and a link to cancel. A week before the concert, it emails them a reminder (see [Reminders](#reminders)).

The Sheet and the script belong to the Google account `bergharen.klassiek.2021@gmail.com`, which also sends the confirmation emails. Guests see them as coming from the foundation's address, `bergharenklassiek@outlook.com`, once that's set up in Gmail (see [Sender address](#sender-address)).

The foundation's email address is in two places. Change both when it changes:

- `SENDER_EMAIL` in `apps-script/reservations.gs`: the sender of confirmation emails, and where replies go. Deploy the script afterwards with `npm run sheet:deploy`.
- `reservationEmail` in `src/app/core/config/reservation.config.ts`: the "reserve by email" link on the website.

## Setup

The script is deployed from this repository with [clasp](https://github.com/google/clasp), Google's command-line tool for Apps Script. The Dutch menu names are in brackets.

### 1. Create the Sheet and the web app (once)

1. Create a new Google Sheet with the Google account `bergharen.klassiek.2021@gmail.com`, for example `Reserveringen Bergharen Klassiek`.
2. In the Sheet, open **Extensions → Apps Script** (*Extensies → Apps Script*).
3. Click **Deploy → New deployment** (*Implementeren → Nieuwe implementatie*), choose type **Web app** and set:
   - **Execute as** (*Uitvoeren als*): Me
   - **Who has access** (*Wie heeft toegang*): Anyone (*Iedereen*)
4. Click **Deploy** and allow the permissions it asks for. The script needs to edit the Sheet and send email as you. See [Allowing permissions](#allowing-permissions).

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

- **Reserveringen:** one row per reservation, with the time received, concert, concert date, name, email address, number of people, **Event ID**, **Annuleercode**, **Concertmoment**, **Locatie**, **Slug** and **Herinnering verstuurd**.
- **Concerten:** one row per concert, with its **Capaciteit**, the number of reserved seats (**Gereserveerd**), the number of seats still available (**Beschikbaar**) and its **Event ID**. Every concert gets a capacity of 120 (`DEFAULT_CAPACITY` in the script), which you can change per concert here. An empty cell also counts as 120. Concerts added before the default changed keep the capacity they were given, so check those. Once a concert is full, the website tells guests there are no seats left, or how many are still available.

All counting is done by **Event ID**, the Storyblok ID of the concert. Unlike the title or the web address, it never changes, so renaming a concert in Storyblok doesn't affect its count. Don't edit the Event ID cells.

The script finds columns by their header, so you can reorder or add columns. Don't rename the headers. If a column is missing, for example in a spreadsheet made with an older version of the script, the script adds it at the end. Reservations made before the Event ID column existed have no ID and aren't counted.

The **Gereserveerd** and **Beschikbaar** totals are written by the script, not by a formula. They update after every reservation, whenever you edit a cell in either tab, and whenever the spreadsheet is opened. You can also update them from the **Reserveringen → Aantallen bijwerken** menu. That menu appears a few seconds after the spreadsheet opens.

Guests cancel with the link in their confirmation email. It leads to `/annuleren/<Annuleercode>` on the website, where a button deletes their row and updates the totals. The code is what proves it's their reservation, so don't share it or edit those cells. Opening the link changes nothing, because mail scanners open links too. Reservations made before this column existed have no code, so those guests can reply to their email instead.

To cancel a reservation yourself, delete its row in **Reserveringen**. The seats become available on the website straight away, because the script counts the rows on every reservation. Deleting a row doesn't count as an edit, so to see the new totals in **Concerten**, use **Reserveringen → Aantallen bijwerken**.

## Reminders

A daily trigger runs `sendReminders` between 10:00 and 11:00. It emails each guest a reminder a week before their concert, with the same details as the confirmation email and the cancel link.

Turn it on once, after deploying: in the Apps Script editor, select `installReminderTrigger` in the toolbar, click **Run** (*Uitvoeren*) and allow the permissions it asks for (see [Allowing permissions](#allowing-permissions)). Google's triggers use the most recently uploaded code, so `npm run sheet:push` already changes the reminders, without `sheet:deploy`. To turn them off, delete the trigger under **Triggers** (*Triggers*, clock icon).

- **Daily limit:** at most 80 reminders go out per day (`MAX_REMINDERS_PER_DAY`), which leaves room for confirmation emails. The rest go out the next day, so a concert with more than 100 reservations takes two days, starting with the soonest concert. A concert with 81 to 100 reservations also takes two days.
- **Who gets one:** one email per reservation. Guests who booked in the final week don't get one, because they just got their confirmation. Cancelled reservations don't either, because their row is gone.
- **Sent:** **Herinnering verstuurd** shows when the reminder went out. A failed email leaves it empty and is tried again the next day, until the day before the concert. Details are under **Executions** (*Uitvoeringen*).
- **Changed concert:** the Storyblok date isn't checked. If a concert moves, change **Concertmoment** (written as `2026-11-22 16:00`) and **Datum concert** in its rows. If a concert is cancelled, delete its rows or type something in **Herinnering verstuurd**, such as `afgelast`, before the reminders go out.
- **Older reservations:** reservations made before these columns existed get a reminder based on **Datum concert**, without the time, location or calendar link, and they're asked to reply to cancel.

To change the timing, edit `REMINDER_DAYS_BEFORE` in the script. To change the hour, edit `REMINDER_HOUR` and run `installReminderTrigger` again.

## Changing the script

Edit `reservations.gs` in this repository and run `npm run sheet:deploy`. Use `npm run sheet:push` to upload without publishing, for example to try a change in the Apps Script editor first.

When a change needs a new permission, for example to use Gmail, the web app stops sending emails until you allow it. Open the Apps Script editor, select `doGet` in the toolbar, click **Run** (*Uitvoeren*) and allow the permissions it asks for (see [Allowing permissions](#allowing-permissions)).

Reservations are still saved when the email fails, and the guest still sees the thank-you message. The failure shows up as **Failed** under **Executions** (*Uitvoeringen*), usually without details. To see the error, run a function that sends an email from the editor.

### Allowing permissions

1. Google warns that **Google hasn't verified this app**. That's normal for your own script: click **Advanced** (*Geavanceerd*) and then **Go to <project name> (unsafe)** (*Ga naar <projectnaam> (onveilig)*).
2. Tick every permission, or **Select all** (*Alles selecteren*), and click **Continue** (*Doorgaan*). If Gmail stays unticked, confirmation emails fail with "The script does not have permission to perform that action".

Don't create a *new* deployment for a change: it gets a new URL, which would then also need changing on the website.

## Sender address

Gmail only sends from another address after you prove you own it. Until then, confirmation emails come from `bergharen.klassiek.2021@gmail.com`, and replies still go to `SENDER_EMAIL`. To send them from `bergharenklassiek@outlook.com`:

1. Log in to Gmail as `bergharen.klassiek.2021@gmail.com` and open **Settings → See all settings → Accounts and Import** (*Instellingen → Alle instellingen bekijken → Accounts en import*).
2. Under **Send mail as** (*Mail verzenden als*), click **Add another email address** (*Nog een e-mailadres toevoegen*) and enter `Bergharen Klassiek` and `bergharenklassiek@outlook.com`.
3. Gmail asks for the Outlook mail server: `smtp-mail.outlook.com`, port 587, TLS, with the Outlook address and its password. If the Outlook account uses two-step verification, use an [app password](https://account.live.com/proofs/AppPassword) instead.
4. Open the confirmation email Gmail sends to the Outlook inbox and confirm.

The script checks for the address on every email, so this takes effect without a new deploy.

## Limits

A free Google account can send about 100 emails a day. A Google Workspace account can send about 1,500. Reminders count towards this limit (see [Reminders](#reminders)).
