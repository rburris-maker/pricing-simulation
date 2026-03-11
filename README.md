# 🏆 March Madness: Pricing Strategy Showdown
## Multiplayer Classroom Edition

---

## QUICK START (5 minutes)

### Step 1 — Install Node.js
Download from: https://nodejs.org  (choose the LTS version)

### Step 2 — Install dependencies
Open a terminal/command prompt in this folder and run:
```
npm install
```

### Step 3 — Start the server
```
npm start
```

You'll see output like:
```
════════════════════════════════════════════════════
  MARCH MADNESS: PRICING STRATEGY SHOWDOWN
════════════════════════════════════════════════════
  ✅  Server running!

  🎓  TEACHER  →  http://192.168.1.42:3000/
  📱  STUDENTS →  http://192.168.1.42:3000/student

  Students connect over your classroom WiFi.
  Put the student URL on your projector!
════════════════════════════════════════════════════
```

### Step 4 — Open your teacher dashboard
Open the **TEACHER** URL in your browser (on your computer).

### Step 5 — Students join
Put the **STUDENT** URL on your projector. Students open it on their phones/laptops.

---

## HOW THE GAME WORKS

**Teacher controls the game from the teacher dashboard.**
**Students join, pick a team, and vote from their own devices.**

### Game Flow:
1. **LOBBY** — Students join and self-assign to teams. Teacher can rename teams.
2. **MATCHUP ANALYSIS** — Both companies' attributes are shown. Strategies are hidden.
3. **OPEN VOTING** — Teacher reveals the market condition. Students vote on their phones.
4. **RUN SIMULATION** — Teacher runs the simulation. Scores are calculated.
5. **RESULTS** — Winner revealed, strategies revealed, points awarded.
6. Repeat for all 15 matchups through the bracket.
7. **CHAMPION CROWNED** — Final leaderboard shown.

### Scoring:
- Each team earns **+1 point** when the majority of their members vote for the correct winner.
- Final standings show points + prediction accuracy.

---

## CLASSROOM SETUP TIPS

- Make sure your computer and all student devices are on **the same WiFi network**.
- Display the teacher dashboard on your projector — it updates live.
- Put the student URL on a second screen or write it on the board.
- Runs best with 2–8 teams.

## CUSTOMIZATION

Open `server.js` to:
- **Add companies**: Add to `COMPANIES{}`, add id to `INITIAL_BRACKET_ORDER`
- **Add market conditions**: Push to `MARKET_CONDITIONS[]`
- **Adjust scoring weights**: Edit `SCORE_WEIGHTS{}`
- **Change port**: Set `PORT` environment variable or edit the constant

---

## FILES

| File | Purpose |
|------|---------|
| `server.js` | Game server — WebSocket + HTTP + scoring engine |
| `teacher.html` | Teacher dashboard (projector view) |
| `student.html` | Student mobile app |
| `package.json` | Node.js dependencies |

---

## TROUBLESHOOTING

**Students can't connect?**
- Check that everyone is on the same WiFi network.
- Try using the exact IP shown in the terminal (not `localhost`).
- Disable any firewall blocking port 3000.

**Server crashes?**
- Make sure you ran `npm install` first.
- Check that Node.js v16+ is installed: `node --version`

**Port already in use?**
- Run `PORT=3001 npm start` to use a different port.
