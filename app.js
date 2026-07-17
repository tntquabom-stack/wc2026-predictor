// World Cup 2026 Score Predictor Engine

// --- Math & Simulation Helpers ---
function factorial(n) {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Poisson Probability: P(k; lambda) = (lambda^k * e^-lambda) / k!
function poissonProbability(k, lambda) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Calculate expected goals for Team A and Team B
function calculateExpectedGoals(teamA, teamB, modifiers = {}) {
  const baseAvgGoals = 1.35; // average goals per team per match in WC

  // Tournament momentum: teams that have performed exceptionally well
  // in the actual WC2026 get a slight boost reflecting real form
  const TOURNAMENT_MOMENTUM = {
    'argentina': 1.08, // Finalist: comeback king, Messi on fire, 2 kiến tạo bán kết
    'spain': 1.07,     // Finalist: dominant defense, clean sheet vs France in SF
    'france': 1.03,    // Semifinalist: strong run but lost 0-2 in SF
    'england': 1.02,   // Semifinalist: Bellingham carried but faded late
    'belgium': 1.02,   // QF: destroyed USA 4-1
    'norway': 1.04,    // QF surprise: eliminated Brazil
    'switzerland': 1.03, // QF: beat Colombia on penalties
    'morocco': 1.02    // QF: strong defensive display
  };

  // Custom sliders inputs (default to initial team ratings if not provided)
  const attackA = modifiers.attackA !== undefined ? modifiers.attackA : teamA.attack;
  const defenseA = modifiers.defenseA !== undefined ? modifiers.defenseA : teamA.defense;
  const attackB = modifiers.attackB !== undefined ? modifiers.attackB : teamB.attack;
  const defenseB = modifiers.defenseB !== undefined ? modifiers.defenseB : teamB.defense;

  const formA = modifiers.formA !== undefined ? modifiers.formA : 3; // 1 to 5
  const formB = modifiers.formB !== undefined ? modifiers.formB : 3;

  // Attack strengths and defense weaknesses (normalized around 75 rating)
  const attStrengthA = attackA / 75;
  const defWeaknessB = (150 - defenseB) / 75;
  const attStrengthB = attackB / 75;
  const defWeaknessA = (150 - defenseA) / 75;

  // Form factor (form 3 = 1.0x, form 5 = 1.15x, form 1 = 0.85x)
  const formFactorA = 1.0 + (formA - 3) * 0.075;
  const formFactorB = 1.0 + (formB - 3) * 0.075;

  // Host advantage (applied to USA, MEX, CAN if modifiers.hostAdvantage is enabled)
  const hostAdvantage = modifiers.hostAdvantage !== false;
  const hostFactorA = (hostAdvantage && teamA.host) ? 1.15 : 1.0;
  const hostFactorB = (hostAdvantage && teamB.host) ? 1.15 : 1.0;

  // Tournament momentum factor
  const momentumA = TOURNAMENT_MOMENTUM[teamA.id] || 1.0;
  const momentumB = TOURNAMENT_MOMENTUM[teamB.id] || 1.0;

  // Expected goals (lambda)
  let lambdaA = baseAvgGoals * attStrengthA * defWeaknessB * formFactorA * hostFactorA * momentumA;
  let lambdaB = baseAvgGoals * attStrengthB * defWeaknessA * formFactorB * hostFactorB * momentumB;

  // Ensure lambda is positive and reasonable
  lambdaA = Math.max(0.1, lambdaA);
  lambdaB = Math.max(0.1, lambdaB);

  return { lambdaA, lambdaB };
}

// Simulate score using random Poisson sampling
function samplePoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Run single match simulation (with optional extra time & penalties for knockout)
function simulateMatch(teamA, teamB, modifiers = {}, isKnockout = false) {
  const { lambdaA, lambdaB } = calculateExpectedGoals(teamA, teamB, modifiers);

  let goalsA = samplePoisson(lambdaA);
  let goalsB = samplePoisson(lambdaB);

  let extraTime = false;
  let etGoalsA = 0;
  let etGoalsB = 0;
  let penalties = false;
  let penA = 0;
  let penB = 0;
  let winner = null;

  if (isKnockout && goalsA === goalsB) {
    extraTime = true;
    // Extra time is 30 mins, so lambda is scaled to 1/3
    etGoalsA = samplePoisson(lambdaA / 3);
    etGoalsB = samplePoisson(lambdaB / 3);
    
    if (etGoalsA === etGoalsB) {
      penalties = true;
      // Simulate penalty shootout
      // Rank-based penalty success probability (better rank gets slight advantage)
      const probA = 0.75 + (teamB.rank - teamA.rank) * 0.001;
      const probB = 0.75 + (teamA.rank - teamB.rank) * 0.001;

      let scoreA = 0;
      let scoreB = 0;
      let rounds = 5;

      // First 5 rounds
      for (let i = 0; i < rounds; i++) {
        if (Math.random() < probA) scoreA++;
        if (Math.random() < probB) scoreB++;
      }

      // Sudden death if tied
      while (scoreA === scoreB) {
        if (Math.random() < probA) scoreA++;
        if (Math.random() < probB) scoreB++;
      }

      penA = scoreA;
      penB = scoreB;
      winner = penA > penB ? teamA.id : teamB.id;
    } else {
      winner = etGoalsA > etGoalsB ? teamA.id : teamB.id;
    }
  } else {
    if (goalsA !== goalsB) {
      winner = goalsA > goalsB ? teamA.id : teamB.id;
    }
  }

  return {
    goalsA,
    goalsB,
    extraTime,
    etGoalsA,
    etGoalsB,
    penalties,
    penA,
    penB,
    winner,
    totalGoalsA: goalsA + etGoalsA,
    totalGoalsB: goalsB + etGoalsB
  };
}

// Monte Carlo simulation for Win/Draw/Loss odds & Score probabilities
function runMonteCarlo(teamA, teamB, modifiers = {}, simulationsCount = 10000) {
  const { lambdaA, lambdaB } = calculateExpectedGoals(teamA, teamB, modifiers);

  let winsA = 0;
  let draws = 0;
  let winsB = 0;

  const scoreFrequencies = {};

  for (let i = 0; i < simulationsCount; i++) {
    const goalsA = samplePoisson(lambdaA);
    const goalsB = samplePoisson(lambdaB);

    if (goalsA > goalsB) {
      winsA++;
    } else if (goalsA === goalsB) {
      draws++;
    } else {
      winsB++;
    }

    const scoreKey = `${goalsA}-${goalsB}`;
    scoreFrequencies[scoreKey] = (scoreFrequencies[scoreKey] || 0) + 1;
  }

  // Calculate percentages
  const probA = (winsA / simulationsCount) * 100;
  const probDraw = (draws / simulationsCount) * 100;
  const probB = (winsB / simulationsCount) * 100;

  // Find top scorelines
  const sortedScores = Object.entries(scoreFrequencies)
    .map(([score, count]) => ({
      score,
      percentage: (count / simulationsCount) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Generate a Poisson grid (up to 5-5 goals) for heatmap
  const poissonGrid = [];
  for (let i = 0; i <= 5; i++) {
    poissonGrid[i] = [];
    for (let j = 0; j <= 5; j++) {
      const pA = poissonProbability(i, lambdaA);
      const pB = poissonProbability(j, lambdaB);
      poissonGrid[i][j] = pA * pB * 100; // in percentage
    }
  }

  // Determine the analytical "most likely score" from Poisson
  let maxProb = -1;
  let mlScore = "1-1";
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      if (poissonGrid[i][j] > maxProb) {
        maxProb = poissonGrid[i][j];
        mlScore = `${i}-${j}`;
      }
    }
  }

  return {
    probA,
    probDraw,
    probB,
    topScores: sortedScores,
    poissonGrid,
    mostLikelyScore: mlScore,
    mostLikelyProb: maxProb,
    expectedGoalsA: lambdaA,
    expectedGoalsB: lambdaB
  };
}

// Generate random match events commentary for visual excitement
function generateCommentary(teamA, teamB, matchResult) {
  const events = [];
  const teamAName = teamA.vnName;
  const teamBName = teamB.vnName;
  
  const totalGoalsA = matchResult.goalsA;
  const totalGoalsB = matchResult.goalsB;

  // Timestamps for goals
  const goalTimesA = [];
  const goalTimesB = [];
  for (let i = 0; i < totalGoalsA; i++) goalTimesA.push(Math.floor(Math.random() * 88) + 1);
  for (let i = 0; i < totalGoalsB; i++) goalTimesB.push(Math.floor(Math.random() * 88) + 1);
  
  goalTimesA.sort((a, b) => a - b);
  goalTimesB.sort((a, b) => a - b);

  let scoreA = 0;
  let scoreB = 0;

  // Add intro
  events.push({ minute: 0, type: "system", text: `Trận đấu giữa ${teamAName} và ${teamBName} đã chính thức bắt đầu!` });

  // Distribute other random events (shots, cards, saves)
  const minutesWithEvents = new Set();
  const maxEvents = 6;
  for (let i = 0; i < maxEvents; i++) {
    minutesWithEvents.add(Math.floor(Math.random() * 85) + 3);
  }

  // Commentaries database
  const commentaryPool = [
    { type: "attack", text: (t1, t2) => `${t1} đang tạo sức ép dữ dội lên phần sân của ${t2}.` },
    { type: "shot", text: (t1, t2) => `Cú sút xa rất căng từ tiền đạo ${t1}! Thủ môn ${t2} phải bay người cản phá.` },
    { type: "card", text: (t1, t2) => `Trọng tài rút thẻ vàng cảnh cáo hậu vệ bên phía ${t1} sau pha phạm lỗi nguy hiểm.` },
    { type: "save", text: (t1, t2) => `Pha cứu thua xuất thần của thủ thành ${t2} sau cú đánh đầu cận thành!` },
    { type: "miss", text: (t1, t2) => `Cơ hội ngon ăn bị bỏ lỡ! Tiền vệ ${t1} dứt điểm chệch cột dọc trong gang tấc.` }
  ];

  for (let m = 1; m <= 90; m++) {
    // Check if Team A scores
    if (goalTimesA.includes(m)) {
      scoreA++;
      events.push({
        minute: m,
        type: "goal",
        team: "A",
        score: `${scoreA}-${scoreB}`,
        text: `VÀOOOOO! ${teamAName} ghi bàn mở rộng khoảng cách! Tỷ số hiện tại là ${scoreA} - ${scoreB}.`
      });
    }
    // Check if Team B scores
    else if (goalTimesB.includes(m)) {
      scoreB++;
      events.push({
        minute: m,
        type: "goal",
        team: "B",
        score: `${scoreA}-${scoreB}`,
        text: `VÀOOOOO! ${teamBName} có bàn thắng quân bình tỉ số! Tỷ số là ${scoreA} - ${scoreB}.`
      });
    }
    // Half time
    else if (m === 45) {
      events.push({ minute: 45, type: "system", text: `Trọng tài thổi còi kết thúc hiệp 1. Tỷ số tạm thời là ${scoreA} - ${scoreB}.` });
    }
    // Other commentary
    else if (minutesWithEvents.has(m)) {
      const isTeamAActive = Math.random() > 0.5;
      const activeTeam = isTeamAActive ? teamAName : teamBName;
      const passiveTeam = isTeamAActive ? teamBName : teamAName;
      const randCommentary = commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
      events.push({
        minute: m,
        type: randCommentary.type,
        text: randCommentary.text(activeTeam, passiveTeam)
      });
    }
  }

  // End of 90 minutes
  events.push({ minute: 90, type: "system", text: `Hết giờ! Trận đấu kết thúc với tỷ số chính thức: ${scoreA} - ${scoreB}.` });

  // Add extra time and penalty events if they occurred
  if (matchResult.extraTime) {
    events.push({ minute: 91, type: "system", text: `Tỷ số hòa buộc hai đội phải bước vào 30 phút Hiệp phụ!` });
    
    let etScoreA = scoreA;
    let etScoreB = scoreB;
    const etGoalTimesA = [];
    const etGoalTimesB = [];
    for (let i = 0; i < matchResult.etGoalsA; i++) etGoalTimesA.push(Math.floor(Math.random() * 28) + 91);
    for (let i = 0; i < matchResult.etGoalsB; i++) etGoalTimesB.push(Math.floor(Math.random() * 28) + 91);

    for (let m = 91; m <= 120; m++) {
      if (etGoalTimesA.includes(m)) {
        etScoreA++;
        events.push({
          minute: m,
          type: "goal",
          team: "A",
          score: `${etScoreA}-${etScoreB}`,
          text: `VÀOOOOO! Hiệp phụ đầy kịch tính! ${teamAName} ghi bàn nâng tỷ số lên ${etScoreA} - ${etScoreB}.`
        });
      } else if (etGoalTimesB.includes(m)) {
        etScoreB++;
        events.push({
          minute: m,
          type: "goal",
          team: "B",
          score: `${etScoreA}-${etScoreB}`,
          text: `VÀOOOOO! ${teamBName} gỡ hòa ngoạn mục trong hiệp phụ! Tỷ số ${etScoreA} - ${etScoreB}.`
        });
      }
    }
    
    events.push({ minute: 120, type: "system", text: `Hiệp phụ kết thúc! Tỷ số chung cuộc sau 120 phút là ${etScoreA} - ${etScoreB}.` });
    scoreA = etScoreA;
    scoreB = etScoreB;

    if (matchResult.penalties) {
      events.push({ minute: 121, type: "system", text: `Vẫn chưa phân định thắng thua! Hai đội bước vào loạt sút luân lưu cân não!` });
      events.push({
        minute: 125,
        type: "penalties",
        text: `Loạt sút luân lưu kết thúc! Kết quả Penalty: ${teamAName} ${matchResult.penA} - ${matchResult.penB} ${teamBName}.`
      });
      const penWinner = matchResult.penA > matchResult.penB ? teamAName : teamBName;
      events.push({ minute: 130, type: "system", text: `CHUNG CUỘC: ${penWinner} giành chiến thắng kịch tính để đi tiếp!` });
    }
  }

  return events;
}

// --- World Cup Tournament Simulation State ---
let tournamentState = {
  stage: "group_stage", // group_stage, round_of_32, round_of_16, quarterfinals, semifinals, final, finished
  groups: {}, // Group standings and data
  groupMatches: [], // List of group stage matches
  groupMatchesSimulated: false,
  knockoutBracket: {
    r32: [], // 16 matches
    r16: [], // 8 matches
    qf: [],  // 4 matches
    sf: [],  // 2 matches
    final: null, // 1 match
    thirdPlace: null, // 1 match
    winner: null,
    thirdPlaceWinner: null
  }
};

// Initialize World Cup Groups
function initTournament() {
  tournamentState.stage = "group_stage";
  tournamentState.groupMatchesSimulated = false;
  tournamentState.knockoutBracket = { r32: [], r16: [], qf: [], sf: [], final: null, thirdPlace: null, winner: null, thirdPlaceWinner: null };

  // Setup initial standings for all 12 groups (A - L)
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  tournamentState.groups = {};
  tournamentState.groupMatches = [];

  letters.forEach(g => {
    const groupTeams = TEAMS.filter(t => t.group === g);
    
    // Group Standings
    tournamentState.groups[g] = groupTeams.map(t => ({
      teamId: t.id,
      name: t.name,
      vnName: t.vnName,
      flagCode: t.flagCode,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    }));

    // Round-robin matches (6 matches per group)
    // Team indexes: 0-1, 0-2, 0-3, 1-2, 1-3, 2-3
    const matchPairs = [
      [0, 1], [2, 3],
      [0, 2], [1, 3],
      [0, 3], [1, 2]
    ];

    matchPairs.forEach(pair => {
      tournamentState.groupMatches.push({
        group: g,
        teamAId: groupTeams[pair[0]].id,
        teamBId: groupTeams[pair[1]].id,
        goalsA: null,
        goalsB: null,
        simulated: false
      });
    });
  });
}

// Simulate all Group Stage matches
function simulateGroupStage() {
  if (tournamentState.groupMatchesSimulated) return;

  // Reset group standings first
  for (const g in tournamentState.groups) {
    tournamentState.groups[g].forEach(standing => {
      standing.played = 0;
      standing.won = 0;
      standing.drawn = 0;
      standing.lost = 0;
      standing.goalsFor = 0;
      standing.goalsAgainst = 0;
      standing.goalDifference = 0;
      standing.points = 0;
    });
  }

  // Simulate each match
  tournamentState.groupMatches.forEach(match => {
    const teamA = getTeamById(match.teamAId);
    const teamB = getTeamById(match.teamBId);
    const result = simulateMatch(teamA, teamB, {}, false); // Group stage matches can be draws
    
    match.goalsA = result.goalsA;
    match.goalsB = result.goalsB;
    match.simulated = true;

    // Update Standings for Team A
    const standingA = tournamentState.groups[match.group].find(s => s.teamId === match.teamAId);
    standingA.played++;
    standingA.goalsFor += result.goalsA;
    standingA.goalsAgainst += result.goalsB;
    standingA.goalDifference = standingA.goalsFor - standingA.goalsAgainst;

    // Update Standings for Team B
    const standingB = tournamentState.groups[match.group].find(s => s.teamId === match.teamBId);
    standingB.played++;
    standingB.goalsFor += result.goalsB;
    standingB.goalsAgainst += result.goalsA;
    standingB.goalDifference = standingB.goalsFor - standingB.goalsAgainst;

    if (result.goalsA > result.goalsB) {
      standingA.won++;
      standingA.points += 3;
      standingB.lost++;
    } else if (result.goalsA === result.goalsB) {
      standingA.drawn++;
      standingA.points += 1;
      standingB.drawn++;
      standingB.points += 1;
    } else {
      standingB.won++;
      standingB.points += 3;
      standingA.lost++;
    }
  });

  // Sort each group standings
  // Order rules: Points -> Goal Difference -> Goals For -> FIFA Rank (descending)
  for (const g in tournamentState.groups) {
    tournamentState.groups[g].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      
      const teamA = getTeamById(a.teamId);
      const teamB = getTeamById(b.teamId);
      return teamA.rank - teamB.rank; // lower rank (1st, 2nd) is better
    });
  }

  tournamentState.groupMatchesSimulated = true;
  tournamentState.stage = "round_of_32";
}

// Generate the Round of 32 matches
function generateRoundOf32() {
  if (tournamentState.stage !== "round_of_32" || tournamentState.knockoutBracket.r32.length > 0) return;

  const qualified1st = [];
  const qualified2nd = [];
  const qualified3rd = [];

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  letters.forEach(g => {
    const standings = tournamentState.groups[g];
    qualified1st.push(standings[0].teamId);
    qualified2nd.push(standings[1].teamId);
    qualified3rd.push({
      teamId: standings[2].teamId,
      group: g,
      points: standings[2].points,
      goalDifference: standings[2].goalDifference,
      goalsFor: standings[2].goalsFor
    });
  });

  // Rank 3rd placed teams to find the 8 best
  qualified3rd.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const teamA = getTeamById(a.teamId);
    const teamB = getTeamById(b.teamId);
    return teamA.rank - teamB.rank; // Lower rank is better
  });

  const best3rdIds = qualified3rd.slice(0, 8).map(t => t.teamId);

  // Match Pairings for R32
  // We pair 1st place of a group against a 3rd place team, and 2nd places against each other.
  // 12 groups, so 12 group winners (1A - 1L) and 12 runners-up (2A - 2L) and 8 third-place (3rd_1 to 3rd_8).
  // Total = 32 teams.
  // Let's pair them systematically:
  // Match 1: 1A vs 3rd_1
  // Match 2: 2A vs 2B
  // Match 3: 1B vs 3rd_2
  // Match 4: 1C vs 3rd_3
  // Match 5: 2C vs 2D
  // Match 6: 1D vs 3rd_4
  // Match 7: 1E vs 3rd_5
  // Match 8: 2E vs 2F
  // Match 9: 1F vs 3rd_6
  // Match 10: 1G vs 3rd_7
  // Match 11: 2G vs 2H
  // Match 12: 1H vs 3rd_8
  // Match 13: 1I vs 2J
  // Match 14: 2I vs 1J
  // Match 15: 1K vs 2L
  // Match 16: 2K vs 1L

  const r32Pairings = [
    { t1: qualified1st[0], t2: best3rdIds[0] },  // 1A vs 3rd_1
    { t1: qualified2nd[0], t2: qualified2nd[1] }, // 2A vs 2B
    { t1: qualified1st[1], t2: best3rdIds[1] },  // 1B vs 3rd_2
    { t1: qualified1st[2], t2: best3rdIds[2] },  // 1C vs 3rd_3
    { t1: qualified2nd[2], t2: qualified2nd[3] }, // 2C vs 2D
    { t1: qualified1st[3], t2: best3rdIds[3] },  // 1D vs 3rd_4
    { t1: qualified1st[4], t2: best3rdIds[4] },  // 1E vs 3rd_5
    { t1: qualified2nd[4], t2: qualified2nd[5] }, // 2E vs 2F
    { t1: qualified1st[5], t2: best3rdIds[5] },  // 1F vs 3rd_6
    { t1: qualified1st[6], t2: best3rdIds[6] },  // 1G vs 3rd_7
    { t1: qualified2nd[6], t2: qualified2nd[7] }, // 2G vs 2H
    { t1: qualified1st[7], t2: best3rdIds[7] },  // 1H vs 3rd_8
    { t1: qualified1st[8], t2: qualified2nd[9] }, // 1I vs 2J
    { t1: qualified2nd[8], t2: qualified1st[9] }, // 2I vs 1J
    { t1: qualified1st[10], t2: qualified2nd[11] }, // 1K vs 2L
    { t1: qualified2nd[10], t2: qualified1st[11] }  // 2K vs 1L
  ];

  tournamentState.knockoutBracket.r32 = r32Pairings.map((pair, idx) => ({
    id: `R32_M${idx + 1}`,
    teamAId: pair.t1,
    teamBId: pair.t2,
    goalsA: null,
    goalsB: null,
    extraTime: false,
    penalties: false,
    penA: null,
    penB: null,
    winnerId: null,
    simulated: false
  }));
}

// Simulate a stage of knockouts (R32, R16, QF, SF, Final)
function simulateKnockoutStage(stageName) {
  let matches = [];
  if (stageName === "r32") matches = tournamentState.knockoutBracket.r32;
  else if (stageName === "r16") matches = tournamentState.knockoutBracket.r16;
  else if (stageName === "qf") matches = tournamentState.knockoutBracket.qf;
  else if (stageName === "sf") matches = tournamentState.knockoutBracket.sf;
  else if (stageName === "final") {
    matches = [tournamentState.knockoutBracket.final];
    if (tournamentState.knockoutBracket.thirdPlace) {
      matches.push(tournamentState.knockoutBracket.thirdPlace);
    }
  }

  matches.forEach(match => {
    if (match.simulated) return;

    const teamA = getTeamById(match.teamAId);
    const teamB = getTeamById(match.teamBId);
    
    // Knockout match simulation (allows extra time / penalties)
    const result = simulateMatch(teamA, teamB, {}, true);

    match.goalsA = result.goalsA + result.etGoalsA;
    match.goalsB = result.goalsB + result.etGoalsB;
    match.extraTime = result.extraTime;
    match.penalties = result.penalties;
    match.penA = result.penA;
    match.penB = result.penB;
    match.winnerId = result.winner;
    match.simulated = true;
  });

  // Advance to next stage structure
  if (stageName === "r32") {
    // Generate R16 from R32 winners
    // Winner M1 vs Winner M2, M3 vs M4, etc.
    const r32 = tournamentState.knockoutBracket.r32;
    tournamentState.knockoutBracket.r16 = [];
    for (let i = 0; i < 16; i += 2) {
      tournamentState.knockoutBracket.r16.push({
        id: `R16_M${(i / 2) + 1}`,
        teamAId: r32[i].winnerId,
        teamBId: r32[i + 1].winnerId,
        goalsA: null,
        goalsB: null,
        extraTime: false,
        penalties: false,
        penA: null,
        penB: null,
        winnerId: null,
        simulated: false
      });
    }
    tournamentState.stage = "round_of_16";
  } else if (stageName === "r16") {
    // Generate QF
    const r16 = tournamentState.knockoutBracket.r16;
    tournamentState.knockoutBracket.qf = [];
    for (let i = 0; i < 8; i += 2) {
      tournamentState.knockoutBracket.qf.push({
        id: `QF_M${(i / 2) + 1}`,
        teamAId: r16[i].winnerId,
        teamBId: r16[i + 1].winnerId,
        goalsA: null,
        goalsB: null,
        extraTime: false,
        penalties: false,
        penA: null,
        penB: null,
        winnerId: null,
        simulated: false
      });
    }
    tournamentState.stage = "quarterfinals";
  } else if (stageName === "qf") {
    // Generate SF
    const qf = tournamentState.knockoutBracket.qf;
    tournamentState.knockoutBracket.sf = [];
    for (let i = 0; i < 4; i += 2) {
      tournamentState.knockoutBracket.sf.push({
        id: `SF_M${(i / 2) + 1}`,
        teamAId: qf[i].winnerId,
        teamBId: qf[i + 1].winnerId,
        goalsA: null,
        goalsB: null,
        extraTime: false,
        penalties: false,
        penA: null,
        penB: null,
        winnerId: null,
        simulated: false
      });
    }
    tournamentState.stage = "semifinals";
  } else if (stageName === "sf") {
    // Generate Final and Third Place
    const sf = tournamentState.knockoutBracket.sf;
    
    // Losers play third place play-off
    const loserSF1 = sf[0].winnerId === sf[0].teamAId ? sf[0].teamBId : sf[0].teamAId;
    const loserSF2 = sf[1].winnerId === sf[1].teamAId ? sf[1].teamBId : sf[1].teamAId;

    tournamentState.knockoutBracket.thirdPlace = {
      id: "THIRD_PLACE",
      teamAId: loserSF1,
      teamBId: loserSF2,
      goalsA: null,
      goalsB: null,
      extraTime: false,
      penalties: false,
      penA: null,
      penB: null,
      winnerId: null,
      simulated: false
    };

    // Winners play Final
    tournamentState.knockoutBracket.final = {
      id: "FINAL",
      teamAId: sf[0].winnerId,
      teamBId: sf[1].winnerId,
      goalsA: null,
      goalsB: null,
      extraTime: false,
      penalties: false,
      penA: null,
      penB: null,
      winnerId: null,
      simulated: false
    };
    
    tournamentState.stage = "final";
  } else if (stageName === "final") {
    tournamentState.knockoutBracket.winner = tournamentState.knockoutBracket.final.winnerId;
    tournamentState.knockoutBracket.thirdPlaceWinner = tournamentState.knockoutBracket.thirdPlace.winnerId;
    tournamentState.stage = "finished";
  }
}

// Simulate the complete tournament in one click
function simulateFullTournament() {
  initTournament();
  simulateGroupStage();
  generateRoundOf32();
  simulateKnockoutStage("r32");
  simulateKnockoutStage("r16");
  simulateKnockoutStage("qf");
  simulateKnockoutStage("sf");
  simulateKnockoutStage("final");
}

// Map from API Team ID to local Team ID
const API_TEAM_MAP = {
  "1": "mexico",
  "2": "south_africa",
  "3": "korea",
  "4": "czechia",
  "5": "canada",
  "6": "bosnia",
  "7": "qatar",
  "8": "switzerland",
  "9": "brazil",
  "10": "morocco",
  "11": "haiti",
  "12": "scotland",
  "13": "usa",
  "14": "paraguay",
  "15": "australia",
  "16": "turkiye",
  "17": "germany",
  "18": "curacao",
  "19": "cote_divoire",
  "20": "ecuador",
  "21": "netherlands",
  "22": "japan",
  "23": "sweden",
  "24": "tunisia",
  "25": "belgium",
  "26": "egypt",
  "27": "iran",
  "28": "new_zealand",
  "29": "spain",
  "30": "cape_verde",
  "31": "saudi_arabia",
  "32": "uruguay",
  "33": "france",
  "34": "senegal",
  "35": "iraq",
  "36": "norway",
  "37": "argentina",
  "38": "algeria",
  "39": "austria",
  "40": "jordan",
  "41": "portugal",
  "42": "dr_congo",
  "43": "uzbekistan",
  "44": "colombia",
  "45": "england",
  "46": "croatia",
  "47": "ghana",
  "48": "panama"
};

// Fetch real games data from API with fallback to local JS variable
async function fetchRealGamesData() {
  const apiUri = "https://worldcup26.ir/get/games";

  try {
    // Attempt live fetch with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    const response = await fetch(apiUri, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("API response error");
    const data = await response.json();
    if (data && data.games && data.games.length > 0) {
      console.log("Loaded live data from API successfully.");
      return data.games;
    }
    throw new Error("Invalid API data format");
  } catch (error) {
    console.warn("Live API fetch failed, falling back to local JS variable:", error);
    if (typeof REAL_GAMES_FALLBACK !== "undefined" && REAL_GAMES_FALLBACK.games) {
      return REAL_GAMES_FALLBACK.games;
    } else if (typeof REAL_GAMES_FALLBACK !== "undefined") {
      return REAL_GAMES_FALLBACK;
    }
    throw new Error("Could not load match results from any source.");
  }
}

// Synchronize tournament state with real match results
function syncTournamentWithRealData(gamesList) {
  // 1. Reset group standings
  for (const g in tournamentState.groups) {
    tournamentState.groups[g].forEach(standing => {
      standing.played = 0;
      standing.won = 0;
      standing.drawn = 0;
      standing.lost = 0;
      standing.goalsFor = 0;
      standing.goalsAgainst = 0;
      standing.goalDifference = 0;
      standing.points = 0;
    });
  }

  // 2. Map Group Stage Matches (type === 'group')
  const apiGroupMatches = gamesList.filter(g => g.type === "group");
  
  tournamentState.groupMatches.forEach(match => {
    // Find matching game in API list
    const teamA = getTeamById(match.teamAId);
    const teamB = getTeamById(match.teamBId);
    
    // Find API match where teams match (order can be home-away or away-home)
    const apiMatch = apiGroupMatches.find(am => {
      const homeMapped = API_TEAM_MAP[am.home_team_id];
      const awayMapped = API_TEAM_MAP[am.away_team_id];
      return (homeMapped === match.teamAId && awayMapped === match.teamBId) ||
             (homeMapped === match.teamBId && awayMapped === match.teamAId);
    });

    if (apiMatch && apiMatch.finished === "TRUE") {
      const isSwapped = API_TEAM_MAP[apiMatch.home_team_id] === match.teamBId;
      match.goalsA = isSwapped ? parseInt(apiMatch.away_score) : parseInt(apiMatch.home_score);
      match.goalsB = isSwapped ? parseInt(apiMatch.home_score) : parseInt(apiMatch.away_score);
      match.simulated = true;

      // Update Standings for Team A
      const standingA = tournamentState.groups[match.group].find(s => s.teamId === match.teamAId);
      standingA.played++;
      standingA.goalsFor += match.goalsA;
      standingA.goalsAgainst += match.goalsB;
      standingA.goalDifference = standingA.goalsFor - standingA.goalsAgainst;

      // Update Standings for Team B
      const standingB = tournamentState.groups[match.group].find(s => s.teamId === match.teamBId);
      standingB.played++;
      standingB.goalsFor += match.goalsB;
      standingB.goalsAgainst += match.goalsA;
      standingB.goalDifference = standingB.goalsFor - standingB.goalsAgainst;

      if (match.goalsA > match.goalsB) {
        standingA.won++;
        standingA.points += 3;
        standingB.lost++;
      } else if (match.goalsA === match.goalsB) {
        standingA.drawn++;
        standingA.points += 1;
        standingB.drawn++;
        standingB.points += 1;
      } else {
        standingB.won++;
        standingB.points += 3;
        standingA.lost++;
      }
    }
  });

  // Sort each group standings
  for (const g in tournamentState.groups) {
    tournamentState.groups[g].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      const teamA = getTeamById(a.teamId);
      const teamB = getTeamById(b.teamId);
      return teamA.rank - teamB.rank;
    });
  }

  tournamentState.groupMatchesSimulated = true;

  // 3. Map Knockout Stages (r32, r16, qf, sf, final, third)
  const mapStageMatches = (apiType, stateBracketArray, prefixId) => {
    const apiStageMatches = gamesList.filter(g => g.type === apiType);
    
    // Sort matches by API ID to ensure stable ordering
    apiStageMatches.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Clear state bracket array
    stateBracketArray.length = 0;

    apiStageMatches.forEach((am, index) => {
      const teamAId = API_TEAM_MAP[am.home_team_id];
      const teamBId = API_TEAM_MAP[am.away_team_id];
      const isFinished = am.finished === "TRUE";

      const matchObj = {
        id: `${prefixId}_M${index + 1}`,
        teamAId: teamAId || null,
        teamBId: teamBId || null,
        goalsA: isFinished ? parseInt(am.home_score) : null,
        goalsB: isFinished ? parseInt(am.away_score) : null,
        extraTime: false,
        penalties: false,
        penA: null,
        penB: null,
        winnerId: null,
        simulated: isFinished
      };

      // Handle penalties if they happened
      if (isFinished) {
        const hasPenalties = am.home_penalty_score !== null && am.home_penalty_score !== "null" && am.home_penalty_score !== undefined;
        if (hasPenalties) {
          matchObj.penalties = true;
          matchObj.extraTime = true;
          matchObj.penA = parseInt(am.home_penalty_score);
          matchObj.penB = parseInt(am.away_penalty_score);
          matchObj.winnerId = matchObj.penA > matchObj.penB ? teamAId : teamBId;
        } else {
          // Check for extra time: since score includes extra time, if it's finished and not a draw,
          // check if there is an extra time goal (e.g. scorer min > 90) or simply check if it went to extra time
          const hasETGoals = (am.home_scorers && am.home_scorers.includes("90+")) || 
                             (am.away_scorers && am.away_scorers.includes("90+")) ||
                             (am.home_scorers && /9\d'|1[0-2]\d'/.test(am.home_scorers)) ||
                             (am.away_scorers && /9\d'|1[0-2]\d'/.test(am.away_scorers));
          
          if (hasETGoals) {
            matchObj.extraTime = true;
          }
          matchObj.winnerId = matchObj.goalsA > matchObj.goalsB ? teamAId : teamBId;
        }
      }

      stateBracketArray.push(matchObj);
    });
  };

  // Map each round
  mapStageMatches("r32", tournamentState.knockoutBracket.r32, "R32");
  mapStageMatches("r16", tournamentState.knockoutBracket.r16, "R16");
  mapStageMatches("qf", tournamentState.knockoutBracket.qf, "QF");
  mapStageMatches("sf", tournamentState.knockoutBracket.sf, "SF");

  // Map Final & Third place
  const apiFinalGames = gamesList.filter(g => g.type === "final");
  const apiThirdGames = gamesList.filter(g => g.type === "third");

  if (apiFinalGames.length > 0) {
    const am = apiFinalGames[0];
    const isFinished = am.finished === "TRUE";
    const teamAId = API_TEAM_MAP[am.home_team_id] || null;
    const teamBId = API_TEAM_MAP[am.away_team_id] || null;

    tournamentState.knockoutBracket.final = {
      id: "FINAL",
      teamAId: teamAId,
      teamBId: teamBId,
      goalsA: isFinished ? parseInt(am.home_score) : null,
      goalsB: isFinished ? parseInt(am.away_score) : null,
      extraTime: false,
      penalties: false,
      penA: null,
      penB: null,
      winnerId: isFinished ? (parseInt(am.home_score) > parseInt(am.away_score) ? teamAId : teamBId) : null,
      simulated: isFinished
    };

    if (isFinished) {
      const hasPenalties = am.home_penalty_score !== null && am.home_penalty_score !== "null" && am.home_penalty_score !== undefined;
      if (hasPenalties) {
        tournamentState.knockoutBracket.final.penalties = true;
        tournamentState.knockoutBracket.final.extraTime = true;
        tournamentState.knockoutBracket.final.penA = parseInt(am.home_penalty_score);
        tournamentState.knockoutBracket.final.penB = parseInt(am.away_penalty_score);
        tournamentState.knockoutBracket.final.winnerId = tournamentState.knockoutBracket.final.penA > tournamentState.knockoutBracket.final.penB ? teamAId : teamBId;
      }
    }
  }

  if (apiThirdGames.length > 0) {
    const am = apiThirdGames[0];
    const isFinished = am.finished === "TRUE";
    const teamAId = API_TEAM_MAP[am.home_team_id] || null;
    const teamBId = API_TEAM_MAP[am.away_team_id] || null;

    tournamentState.knockoutBracket.thirdPlace = {
      id: "THIRD_PLACE",
      teamAId: teamAId,
      teamBId: teamBId,
      goalsA: isFinished ? parseInt(am.home_score) : null,
      goalsB: isFinished ? parseInt(am.away_score) : null,
      extraTime: false,
      penalties: false,
      penA: null,
      penB: null,
      winnerId: isFinished ? (parseInt(am.home_score) > parseInt(am.away_score) ? teamAId : teamBId) : null,
      simulated: isFinished
    };

    if (isFinished) {
      const hasPenalties = am.home_penalty_score !== null && am.home_penalty_score !== "null" && am.home_penalty_score !== undefined;
      if (hasPenalties) {
        tournamentState.knockoutBracket.thirdPlace.penalties = true;
        tournamentState.knockoutBracket.thirdPlace.extraTime = true;
        tournamentState.knockoutBracket.thirdPlace.penA = parseInt(am.home_penalty_score);
        tournamentState.knockoutBracket.thirdPlace.penB = parseInt(am.away_penalty_score);
        tournamentState.knockoutBracket.thirdPlace.winnerId = tournamentState.knockoutBracket.thirdPlace.penA > tournamentState.knockoutBracket.thirdPlace.penB ? teamAId : teamBId;
      }
    }
  }

  // 4. Set current tournament stage based on the first unfinished stage
  const r32Unfinished = tournamentState.knockoutBracket.r32.some(m => !m.simulated);
  const r16Unfinished = tournamentState.knockoutBracket.r16.some(m => !m.simulated);
  const qfUnfinished = tournamentState.knockoutBracket.qf.some(m => !m.simulated);
  const sfUnfinished = tournamentState.knockoutBracket.sf.some(m => !m.simulated);
  const finalUnfinished = !tournamentState.knockoutBracket.final || !tournamentState.knockoutBracket.final.simulated;

  if (r32Unfinished) {
    tournamentState.stage = "round_of_32";
  } else if (r16Unfinished) {
    tournamentState.stage = "round_of_16";
  } else if (qfUnfinished) {
    tournamentState.stage = "quarterfinals";
  } else if (sfUnfinished) {
    tournamentState.stage = "semifinals";
  } else if (finalUnfinished) {
    tournamentState.stage = "final";
  } else {
    tournamentState.stage = "finished";
    tournamentState.knockoutBracket.winner = tournamentState.knockoutBracket.final.winnerId;
    if (tournamentState.knockoutBracket.thirdPlace) {
      tournamentState.knockoutBracket.thirdPlaceWinner = tournamentState.knockoutBracket.thirdPlace.winnerId;
    }
  }

  console.log("Tournament successfully synchronized with real-world results. Stage is now:", tournamentState.stage);
}
