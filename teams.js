const TEAMS = [
  // Group A
  { id: "mexico", name: "Mexico", vnName: "Mexico", group: "A", rank: 15, attack: 78, defense: 76, host: true, flagCode: "mx" },
  { id: "south_africa", name: "South Africa", vnName: "Nam Phi", group: "A", rank: 59, attack: 70, defense: 69, host: false, flagCode: "za" },
  { id: "korea", name: "South Korea", vnName: "Hàn Quốc", group: "A", rank: 22, attack: 77, defense: 75, host: false, flagCode: "kr" },
  { id: "czechia", name: "Czechia", vnName: "CH Séc", group: "A", rank: 36, attack: 75, defense: 74, host: false, flagCode: "cz" },

  // Group B
  { id: "canada", name: "Canada", vnName: "Canada", group: "B", rank: 40, attack: 74, defense: 72, host: true, flagCode: "ca" },
  { id: "bosnia", name: "Bosnia & Herzegovina", vnName: "Bosnia", group: "B", rank: 74, attack: 68, defense: 67, host: false, flagCode: "ba" },
  { id: "qatar", name: "Qatar", vnName: "Qatar", group: "B", rank: 35, attack: 72, defense: 70, host: false, flagCode: "qa" },
  { id: "switzerland", name: "Switzerland", vnName: "Thụy Sĩ", group: "B", rank: 19, attack: 79, defense: 80, host: false, flagCode: "ch" },

  // Group C
  { id: "brazil", name: "Brazil", vnName: "Brazil", group: "C", rank: 5, attack: 92, defense: 88, host: false, flagCode: "br" },
  { id: "morocco", name: "Morocco", vnName: "Ma-rốc", group: "C", rank: 12, attack: 82, defense: 84, host: false, flagCode: "ma" },
  { id: "haiti", name: "Haiti", vnName: "Haiti", group: "C", rank: 86, attack: 65, defense: 62, host: false, flagCode: "ht" },
  { id: "scotland", name: "Scotland", vnName: "Scotland", group: "C", rank: 39, attack: 74, defense: 73, host: false, flagCode: "gb-sct" },

  // Group D
  { id: "usa", name: "United States", vnName: "Mỹ", group: "D", rank: 11, attack: 81, defense: 79, host: true, flagCode: "us" },
  { id: "paraguay", name: "Paraguay", vnName: "Paraguay", group: "D", rank: 56, attack: 70, defense: 72, host: false, flagCode: "py" },
  { id: "australia", name: "Australia", vnName: "Australia", group: "D", rank: 23, attack: 75, defense: 76, host: false, flagCode: "au" },
  { id: "turkiye", name: "Türkiye", vnName: "Thổ Nhĩ Kỳ", group: "D", rank: 26, attack: 78, defense: 76, host: false, flagCode: "tr" },

  // Group E
  { id: "germany", name: "Germany", vnName: "Đức", group: "E", rank: 16, attack: 88, defense: 84, host: false, flagCode: "de" },
  { id: "curacao", name: "Curaçao", vnName: "Curaçao", group: "E", rank: 88, attack: 64, defense: 62, host: false, flagCode: "cw" },
  { id: "cote_divoire", name: "Ivory Coast", vnName: "Bờ Biển Ngà", group: "E", rank: 38, attack: 78, defense: 76, host: false, flagCode: "ci" },
  { id: "ecuador", name: "Ecuador", vnName: "Ecuador", group: "E", rank: 30, attack: 77, defense: 79, host: false, flagCode: "ec" },

  // Group F
  { id: "netherlands", name: "Netherlands", vnName: "Hà Lan", group: "F", rank: 7, attack: 89, defense: 87, host: false, flagCode: "nl" },
  { id: "japan", name: "Japan", vnName: "Nhật Bản", group: "F", rank: 18, attack: 82, defense: 80, host: false, flagCode: "jp" },
  { id: "sweden", name: "Sweden", vnName: "Thụy Điển", group: "F", rank: 28, attack: 80, defense: 78, host: false, flagCode: "se" },
  { id: "tunisia", name: "Tunisia", vnName: "Tunisia", group: "F", rank: 41, attack: 71, defense: 73, host: false, flagCode: "tn" },

  // Group G
  { id: "belgium", name: "Belgium", vnName: "Bỉ", group: "G", rank: 3, attack: 87, defense: 83, host: false, flagCode: "be" },
  { id: "egypt", name: "Egypt", vnName: "Ai Cập", group: "G", rank: 36, attack: 76, defense: 74, host: false, flagCode: "eg" },
  { id: "iran", name: "IR Iran", vnName: "Iran", group: "G", rank: 20, attack: 77, defense: 76, host: false, flagCode: "ir" },
  { id: "new_zealand", name: "New Zealand", vnName: "New Zealand", group: "G", rank: 104, attack: 63, defense: 64, host: false, flagCode: "nz" },

  // Group H
  { id: "spain", name: "Spain", vnName: "Tây Ban Nha", group: "H", rank: 8, attack: 91, defense: 88, host: false, flagCode: "es" },
  { id: "cape_verde", name: "Cape Verde", vnName: "Cabo Verde", group: "H", rank: 65, attack: 68, defense: 68, host: false, flagCode: "cv" },
  { id: "saudi_arabia", name: "Saudi Arabia", vnName: "Ả Rập Xê Út", group: "H", rank: 53, attack: 71, defense: 70, host: false, flagCode: "sa" },
  { id: "uruguay", name: "Uruguay", vnName: "Uruguay", group: "H", rank: 14, attack: 85, defense: 83, host: false, flagCode: "uy" },

  // Group I
  { id: "france", name: "France", vnName: "Pháp", group: "I", rank: 2, attack: 94, defense: 89, host: false, flagCode: "fr" },
  { id: "senegal", name: "Senegal", vnName: "Senegal", group: "I", rank: 17, attack: 79, defense: 79, host: false, flagCode: "sn" },
  { id: "iraq", name: "Iraq", vnName: "Iraq", group: "I", rank: 58, attack: 71, defense: 69, host: false, flagCode: "iq" },
  { id: "norway", name: "Norway", vnName: "Na Uy", group: "I", rank: 47, attack: 79, defense: 72, host: false, flagCode: "no" },

  // Group J
  { id: "argentina", name: "Argentina", vnName: "Argentina", group: "J", rank: 1, attack: 93, defense: 90, host: false, flagCode: "ar" },
  { id: "algeria", name: "Algeria", vnName: "Algeria", group: "J", rank: 43, attack: 74, defense: 73, host: false, flagCode: "dz" },
  { id: "austria", name: "Austria", vnName: "Áo", group: "J", rank: 25, attack: 79, defense: 77, host: false, flagCode: "at" },
  { id: "jordan", name: "Jordan", vnName: "Jordan", group: "J", rank: 71, attack: 68, defense: 66, host: false, flagCode: "jo" },

  // Group K
  { id: "portugal", name: "Portugal", vnName: "Bồ Đào Nha", group: "K", rank: 6, attack: 90, defense: 86, host: false, flagCode: "pt" },
  { id: "dr_congo", name: "DR Congo", vnName: "CHDC Congo", group: "K", rank: 61, attack: 69, defense: 68, host: false, flagCode: "cd" },
  { id: "uzbekistan", name: "Uzbekistan", vnName: "Uzbekistan", group: "K", rank: 64, attack: 70, defense: 69, host: false, flagCode: "uz" },
  { id: "colombia", name: "Colombia", vnName: "Colombia", group: "K", rank: 12, attack: 84, defense: 83, host: false, flagCode: "co" },

  // Group L
  { id: "england", name: "England", vnName: "Anh", group: "L", rank: 4, attack: 92, defense: 88, host: false, flagCode: "gb-eng" },
  { id: "croatia", name: "Croatia", vnName: "Croatia", group: "L", rank: 10, attack: 82, defense: 83, host: false, flagCode: "hr" },
  { id: "ghana", name: "Ghana", vnName: "Ghana", group: "L", rank: 68, attack: 70, defense: 68, host: false, flagCode: "gh" },
  { id: "panama", name: "Panama", vnName: "Panama", group: "L", rank: 45, attack: 72, defense: 71, host: false, flagCode: "pa" }
];

// Helper to get team by ID
function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}
