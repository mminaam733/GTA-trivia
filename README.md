# Vice City Trivia — The Los Santos Brand Quest

A server-graded, proctored trivia experience with participant sessions, organizer-created rooms, shareable links, QR codes, a live server-scored leaderboard, violation history, and proctor lock controls.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mminaam733/GTA-trivia)

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to take the open quiz. Open [http://localhost:3000/proctor](http://localhost:3000/proctor) for the organizer console. The default organizer passcode is `admin123`; set `ADMIN_PASSCODE` in the environment before deployment.

The example bank in `server.js` contains 45 questions (25 multiple choice, 10 true/false, 5 QNA, and 5 case files). Replace those entries with your final question set. Keep each `answer` index or `answerText` keyword on the server; `/api/start` only returns the public question fields.

## Share over local Wi-Fi

Run the server on a computer connected to the same Wi-Fi as participants. Find that computer's LAN IPv4 address (for example `192.168.1.20`), allow inbound TCP traffic on port 3000 in the computer's firewall, then open `http://192.168.1.20:3000/proctor` on the host computer. Create a room there and share the generated link or QR code. Phones and PCs on that Wi-Fi can join using the link.

## Put it on the public internet

The project includes `render.yaml` for Render. To publish it, push this folder to a GitHub repository, then create a new Blueprint in Render and select that repository. Enter a private value for `ADMIN_PASSCODE` when prompted. Render builds the Node service and gives it a public `onrender.com` URL; open that URL plus `/proctor` to create a room. Share the generated participant link or QR code. The app listens on Render's assigned port and uses the forwarded HTTPS protocol when generating links.

For a temporary public link without setting up Render, start the app with `npm.cmd start`, open a second PowerShell window, and run `npx.cmd --yes localtunnel --port 3000`. Use the printed HTTPS URL plus `/proctor` to create a room, then share the generated participant link. Keep both terminals open and the computer awake; the tunnel address changes when restarted.

Render's free web services can spin down after 15 minutes without requests, so the first visit after a quiet period may take longer. For temporary demos without a deployment, expose a running local server with ngrok; your computer must stay on and connected while people use the link.

Railway can also deploy the repository as a Node web service: use `npm install` as the build command, `npm start` as the start command, and set `ADMIN_PASSCODE` in the service variables. Both platforms provide the port through `PORT`.

## Notes

- Room/session data is held in memory and resets when the process restarts; use a persistent database before running multiple server instances or hosting high-stakes events.
- Browser fullscreen and focus detection are proctoring signals, not tamper-proof controls. The server remains authoritative for deadlines, flags, lockouts, and grades.
- iPhone Safari does not provide webpage fullscreen for ordinary pages. The app detects that case, avoids a permanent fullscreen lock, and still records tab/app switches. For an app-like display, open the quiz in Safari, tap **Share** → **Add to Home Screen**, then launch it from the new Home Screen icon.
- The organizer dashboard loads its QR encoder from jsDelivr. If that CDN is blocked, room links can still be copied and shared.
