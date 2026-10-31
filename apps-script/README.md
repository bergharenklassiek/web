# Reservations (Google Sheet)

Reservations made on the website are stored in a Google Sheet by the script in `reservations.gs`. The script also emails the guest a confirmation. Replies to that email go to bergharenklassiek@outlook.com.

## Setup

1. Create a new Google Sheet with the Google account that should send the confirmation emails, for example `Reserveringen Bergharen Klassiek`.
2. In the Sheet, open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the contents of `reservations.gs` and save.
4. Click **Deploy → New deployment**, choose type **Web app** and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy** and allow the permissions it asks for (the script needs to edit the Sheet and send email as you).
6. Copy the **Web app URL** (it ends in `/exec`) into `reservationEndpoint` in `src/app/core/config/reservation.config.ts`.

To check the deployment, open the web app URL in a browser. It should show `{"status":"ok"}`.

Until `reservationEndpoint` is filled in, the website keeps using the old "reserve by email" link.

## Using the Sheet

The script creates two tabs on the first reservation:

- **Reserveringen:** one row per reservation, with the time received, concert, concert date, name, email address, number of people and **Event ID**.
- **Concerten:** one row per concert, with its **Capaciteit**, the total number of reserved seats and its **Event ID**. Every concert gets a capacity of 100 (`DEFAULT_CAPACITY` in the script), which you can change per concert here. An empty cell also counts as 100. Once a concert is full, the website tells guests there are no seats left, or how many are still available.

All counting is done by **Event ID**, the Storyblok ID of the concert. Unlike the title or the web address, it never changes, so renaming a concert in Storyblok doesn't affect its count. Don't edit the Event ID cells.

The script finds columns by their header, so you can reorder or add columns. Don't rename the headers. If a column is missing, for example in a spreadsheet made with an older version of the script, the script adds it at the end. Reservations made before the Event ID column existed have no ID and aren't counted.

The **Gereserveerd** totals are written by the script, not by a formula. They update after every reservation and whenever the spreadsheet is opened. You can also update them from the **Reserveringen → Aantallen bijwerken** menu. That menu appears a few seconds after the spreadsheet opens.

To cancel a reservation, delete its row in **Reserveringen**. The seats become available on the website straight away, because the script counts the rows on every reservation. To see the new total in **Concerten**, use **Reserveringen → Aantallen bijwerken**.

## Changing the script

After editing the script in Apps Script, deploy it again via **Deploy → Manage deployments → edit (pencil) → Version: New version**. This keeps the same URL. A *new* deployment gets a new URL, which would then also need changing on the website.

Keep `reservations.gs` in this repository in sync with what is deployed.

## Limits

A free Google account can send about 100 emails a day. A Google Workspace account can send about 1,500.
