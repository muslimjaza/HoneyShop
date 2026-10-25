# Sync setup (free, about 5 minutes, one time)

The app keeps working offline on every phone. Sync copies sales, stock, customers and
payments between all devices through a Google Sheet that you own. No payment needed.

## 1. Create the server
1. Open https://sheets.google.com and create a new blank sheet (name it "Honey data").
2. Menu **Extensions > Apps Script**.
3. Delete the sample code, paste all of `Code.gs` from this folder.
4. On the first line change `TOKEN` to your own long secret word (letters and numbers,
   for example `honey-9fK2xQ7mLp`). Do not share it publicly.
5. Press **Deploy > New deployment**. Click the gear and pick **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Press **Deploy**, allow the permissions Google asks for (Advanced > Go to project), and
   copy the **Web app URL**. It ends with `/exec`.

Tip: open that URL in a browser. You should see "Honey sync server is running."

## 2. Connect the first device
In the app open **Settings (gear) > Sync**. Paste the URL and the token, press **Connect**.
The cloud icon at the top becomes a green check when it is synced.

## 3. Connect the other devices
On the first device press **Copy setup link** and send it to yourself (only yourself, the
link contains the token). Open it on the other phone or computer. It connects automatically.

## Good to know
- Each device keeps working without internet and syncs when it is back online
  (every 30 seconds while the app is open, and right after each sale).
- All data also sits in the "data" tab of your Google Sheet, which is an extra backup.
  Do not edit that tab by hand.
- If you change `Code.gs` later, use **Deploy > Manage deployments > Edit > New version**.
- Anyone who has the URL and the token can read and write the data. Keep them private.
  To change the token, edit it in Apps Script, deploy a new version, and reconnect the devices.
- If two phones sell the same kilos at the same moment while offline, both sales are kept and
  the app shows a red warning that stock is over-sold, so you can fix the batches.
