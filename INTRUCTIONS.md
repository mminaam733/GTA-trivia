# Vice City Trivia: Setup and Sharing Instructions

This guide covers running the quiz on your computer, sharing it on the same Wi-Fi, and deploying it so people on other networks can join.

## 1. Run it on your computer

You need Node.js installed. Open PowerShell in this project folder:

```powershell
cd "C:\Users\mmina\OneDrive\Desktop\gta"
npm.cmd install
npm.cmd start
```

Use `npm.cmd` in PowerShell because this computer blocks the `npm.ps1` script. Keep this terminal window open while the quiz is running.

Open these pages in your browser:

- Quiz: <http://localhost:3000>
- Organizer dashboard: <http://localhost:3000/proctor>

Organizer passcode: `admin123` (change it for a public deployment).

To stop the local server, focus the terminal and press **Ctrl+C**.

## 2. Share with people on the same Wi-Fi

This works only while your computer is on and the server is running.

1. Find your computer's local IPv4 address. In another PowerShell window, run:

   ```powershell
   ipconfig
   ```

   Find **IPv4 Address** under the Wi-Fi adapter, for example `192.168.1.20`.

2. On your computer, open <http://localhost:3000/proctor> and sign in.
3. Create a room. Copy the participant link or show its QR code.
4. If needed, replace `localhost` in the copied link with your IPv4 address. For example:

   ```text
   http://192.168.1.20:3000/?room=ROOMCODE
   ```

5. Send that link to people connected to the same Wi-Fi. If their devices cannot connect, allow Node.js or TCP port 3000 through your computer's firewall.

## 3. Deploy it for people on other networks

The project has a `render.yaml` deployment configuration. Render hosts the app and provides a public URL, so your computer does not need to stay on.

### A. Put the project on GitHub

1. Sign in to GitHub and create a new repository. A private repository is fine if you connect that GitHub account to Render.
2. In PowerShell, from the project folder, run these commands. Replace `YOUR-GITHUB-USERNAME` and `YOUR-REPOSITORY` with your values:

   ```powershell
   cd "C:\Users\mmina\OneDrive\Desktop\gta"
   git init
   git add .
   git commit -m "Add Vice City trivia app"
   git branch -M main
   git remote add origin https://github.com/YOUR-GITHUB-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   If Git asks you to sign in, complete its browser sign-in flow. If `git` is not recognized, install Git for Windows, open a new PowerShell window, and retry.

### B. Deploy on Render

1. Sign in or create an account at <https://render.com>.
2. In the Render dashboard, choose **New** → **Blueprint**.
3. Connect GitHub if prompted, then select the repository you just pushed.
4. Render reads `render.yaml`. When prompted, enter a private value for `ADMIN_PASSCODE` and create/deploy the service.
5. Wait for the deploy to finish. Render will show a URL like `https://vice-city-brand-quest.onrender.com`.
6. Open the URL with `/proctor`, for example:

   ```text
   https://vice-city-brand-quest.onrender.com/proctor
   ```

7. Sign in with the `ADMIN_PASSCODE` value you set during deployment. Create a room and copy its participant link or share the QR code. That generated HTTPS link is what you send to players on any internet connection.

The free Render service may sleep after a period without activity, so its first visit after being idle can take longer. Keep the deployment running during your event. Room and session data is currently stored in memory and resets whenever the service restarts or redeploys.

## 4. Edit the organizer passcode later

In Render, open the service's **Environment** settings, change `ADMIN_PASSCODE`, save, and redeploy if prompted. Use the new value on `/proctor`.

## Troubleshooting

- **`npm` is blocked in PowerShell:** use `npm.cmd install` and `npm.cmd start`.
- **`localhost:3000` does not open:** check that the server terminal is still running and shows it is listening on port 3000.
- **Players outside your Wi-Fi cannot connect to a localhost link:** deploy on Render and send the generated public HTTPS room link instead.
- **The first public visit is slow:** a free Render service may have been sleeping; wait for it to start.
- **Quiz data disappears after a restart:** current rooms and sessions are in memory. Create the room again after a restart.
