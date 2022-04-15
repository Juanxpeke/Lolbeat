const key = "RGAPI-aff88a70-355a-49f6-906d-2a1ef9be6f03";
language = "en_US";

let name; // Riot API format (Ex: juaniprox -> Juaniprox)
let id;
let puuid;

let matchIndex = 0;

const params = window.location.pathname.split('/').slice(1);
const platform = params[0];
const inputName = params[1];
const region = regionByPlatform(platform);

const platformSelect = document.querySelector(".platform-select");
const usernameInput = document.querySelector(".name-input");

const goButton = document.querySelector(".go-button");
const updateGoLink = () => {
    goButton.href = `/${platformSelect.value}/${usernameInput.value}`;
};

platformSelect.addEventListener("change", updateGoLink);
usernameInput.addEventListener("input", updateGoLink);
usernameInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        goButton.click();
    }
});


updatePlatformSelect();



requestVersions()
    .then(versionsJSON => {
        version = versionsJSON[0];
        return requestChampions();
    })
    .then(championsJSON => {
        championsDData = championsJSON["data"];
        return requestSpells();
    })
    .then(spellsJSON => {
        spellsDData = spellsJSON["data"];
        return requestSummoner(platform, inputName, key);
    })
    .then(summonerJSON => {
        name = summonerJSON["name"];
        id = summonerJSON["id"];
        puuid = summonerJSON["puuid"];
        const userProfileImage = document.querySelector(".profile-img");
        userProfileImage.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${summonerJSON["profileIconId"]}.png`;
        userProfileImage.alt = name;
        userProfileImage.title = name;
        document.querySelector(".user-name").textContent = name;
        document.querySelector(".user-level").textContent = `Level ${summonerJSON["summonerLevel"]}`;
        return requestMasteries(platform, id, key);
    })
    .then(masteriesJSON => {
        const bestChampionName = getChampionName(String(masteriesJSON[0]["championId"]));
        const burl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${bestChampionName}_0.jpg`;
        document.querySelector(".general-button").addEventListener("click", displayGeneral);
        document.querySelector(".matches-button").addEventListener("click", displayMatches);
        document.querySelector(".ranked-button").addEventListener("click", displayRanked);
        document.querySelector(".champions-button").addEventListener("click", displayChampions);
        return displayMatches();
    })
    .catch(error => {
        console.error(error.message);
        // display more
    });

/**
 * Returns the region of a certain platform.
 * @param platform the platform string
 * @returns {string} the region string
 */
function regionByPlatform(platform) {
    const americasPlatforms = ["br1", "la1", "la2", "na1"];
    const asiaPlatforms = ["jp1", "kr"];
    const europePlatforms = ["eun1", "euw1", "ru", "tr1"];
    if (americasPlatforms.includes(platform)) return "americas";
    if (asiaPlatforms.includes(platform)) return "asia";
    if (europePlatforms.includes(platform)) return "europe";
    return "americas";
}

/**
 * Updates the platform select value to the current URL platform.
 */
function updatePlatformSelect() {
    for (let  i = 0; i < platformSelect.length; i++) {
        if (platformSelect.options[i].value === platform) {
            platformSelect.selectedIndex = i;
            break;
        }
    }
}

/*
* =================================================================
* ======================ACCOUNT DISPLAYING=========================
* =================================================================
* */

/**
 * Gets the summoner data of a certain match.
 * @param name The summoner name.
 * @param match The match data dictionary.
 * @return {any} A participant dictionary with all the summoner match information.
 */
function getSummonerMatchData(name, match) {
    const matchParticipants = match["info"]["participants"];
    for (const participant of matchParticipants) {
        if (participant["summonerName"] === name) return participant;
    }
    throw new Error(`Summoner name not found in match ${match["metadata"]["matchId"]}`);
}

/**
 * Gets the spells name correspondent to the given spell keys.
 * @param spell1Key The first spell key.
 * @param spell2Key The second spell key.
 * @return {string[]} An array with both spells names.
 */
function getSpells(spell1Key, spell2Key) {
    const spells = ["", ""];
    for (const spell in spellsDData) {
        if (spells[0] !== "" && spells[1] !== "") break;
        if (spellsDData[spell]["key"] === spell1Key) spells[0] = spell;
        else if (spellsDData[spell]["key"] === spell2Key) spells[1] = spell;
    }
    return spells;
}

function getChampionName(championKey) {
    for (const champion in championsDData) {
        if(championsDData[champion]["key"] === championKey) {
            return championsDData[champion]["name"];
        }
    }
    return "";
}

function displayGeneral() {
    for (const button of document.querySelectorAll(".account-nav-button")) {
        button.classList.remove("account-selected-button");
    }
    document.querySelector(".general-button").classList.add("account-selected-button");
    const accountGeneral = document.createElement("div");
    accountGeneral.textContent = "General information about the summoner.";
    document.querySelector(".account-content").replaceChildren(accountGeneral);
}

/**
 * Displays the account matches in the account content.
 * @return {Promise<void>} The display promise.
 */
async function displayMatches() {
    for (const button of document.querySelectorAll(".account-nav-button")) {
        button.classList.remove("account-selected-button");
    }
    document.querySelector(".matches-button").classList.add("account-selected-button");
    const accountMatches = document.createElement("div");
    accountMatches.classList.add("account-matches");
    const matchesList = document.createElement("div");
    matchesList.classList.add("matches-list");
    const moreMatches = document.createElement("button");
    moreMatches.classList.add("more-matches");
    moreMatches.textContent = "More matches";
    accountMatches.appendChild(matchesList);
    accountMatches.appendChild(moreMatches);
    document.querySelector(".account-content").replaceChildren(accountMatches);
    matchIndex = 0;
    await displayMoreMatches(accountMatches);
}

/**
 * Displays 10 new matches in the account matches element.
 * @return {Promise<void>} The display promise.
 */
async function displayMoreMatches(accountMatches) {
    const moreMatches = accountMatches.querySelector(".more-matches");
    const matchesList = accountMatches.querySelector(".matches-list");
    moreMatches.onclick = () => {};
    const matchesFragment = document.createDocumentFragment();
    const matchTemplate = document.querySelector(".match-template").content.firstElementChild;
    moreMatches.innerHTML = "<div class='lolbeat-loader'></div>";
    let moreMatchesMessage = "More matches";
    try {
        const matches = await requestMatches(region, puuid, matchIndex, key);
        for (const match of matches) {
            const summonerMatchData = getSummonerMatchData(name, match);
            const matchLayout = matchTemplate.cloneNode(true);
            matchLayout.querySelector(".match-div").classList.add(summonerMatchData["win"]?"match-won":"match-lost");
            // Match champ
            const champ = summonerMatchData["championName"];
            const champImg = matchLayout.querySelector(".match-champ-img");
            champImg.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ}.png`;
            champImg.alt = champ;
            champImg.title = champ;
            // Match main data
            matchLayout.querySelector(".match-kda").textContent =
                `${summonerMatchData["kills"]}/` +
                `${summonerMatchData["deaths"]}/` +
                `${summonerMatchData["assists"]}`;
            matchLayout.querySelector(".match-game-mode").textContent = match["info"]["gameMode"];
            // Match secondary data
            matchLayout.querySelector(".match-farm").textContent =
                `${summonerMatchData["totalMinionsKilled"] + summonerMatchData["neutralMinionsKilled"]}`;
            matchLayout.querySelector(".match-gold").textContent = summonerMatchData["goldEarned"];
            // Match items
            const items = [
                summonerMatchData["item0"],
                summonerMatchData["item1"],
                summonerMatchData["item2"],
                summonerMatchData["item3"],
                summonerMatchData["item4"],
                summonerMatchData["item5"],
                summonerMatchData["item6"]];
            const itemsImg = matchLayout.querySelectorAll(".match-item-img");
            for (let i = 0; i < items.length && i < itemsImg.length; i++) {
                if (items[i]) {
                    itemsImg[i].src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${items[i]}.png`;
                    itemsImg[i].alt = items[i];
                    itemsImg[i].title = items[i];
                }
            }
            // Match spells
            const spells = getSpells(
                String(summonerMatchData["summoner1Id"]),
                String(summonerMatchData["summoner2Id"]));
            const spellsImg = matchLayout.querySelectorAll(".match-spell-img");
            for (let i = 0; i < spells.length && i < spellsImg.length; i++) {
                spellsImg[i].src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spells[i]}.png`;
                spellsImg[i].alt = spells[i].substr(8);
                spellsImg[i].title = spells[i].substr(8);
            }
            // Match time data
            const duration = match["info"]["gameDuration"].toString().toHHMMSS();
            const date = new Date(match["info"]["gameStartTimestamp"]).toLocaleDateString();
            matchLayout.querySelector(".match-duration-date").textContent = `${duration}  \u2022  ${date}`;
            // Match details
            const teamID = summonerMatchData["teamId"];
            matchLayout.querySelector(".match-div").addEventListener("click",
                () => displayDetails(matchLayout, match, teamID));
            matchLayout.querySelector(".overview-button").addEventListener("click",
                () => displayDetailsOverview(matchLayout, match, teamID));
            matchLayout.querySelector(".charts-button").addEventListener("click",
                () => displayDetailsCharts(matchLayout, match, teamID));
            // Fragment update
            matchesFragment.appendChild(matchLayout);
        }
        matchesList.appendChild(matchesFragment);
        matchIndex += 10;
    } catch (error) {
        moreMatchesMessage = "Matches not found, try again";
    } finally {
        moreMatches.innerHTML = moreMatchesMessage;
        moreMatches.onclick = () => displayMoreMatches(accountMatches);
    }
}

function displayRanked() {
    for (const button of document.querySelectorAll(".account-nav-button")) {
        button.classList.remove("account-selected-button");
    }
    document.querySelector(".ranked-button").classList.add("account-selected-button");
    const accountRanked = document.createElement("div");
    accountRanked.textContent = "Ranked information about the summoner.";
    document.querySelector(".account-content").replaceChildren(accountRanked);
}

function displayChampions() {
    for (const button of document.querySelectorAll(".account-nav-button")) {
        button.classList.remove("account-selected-button");
    }
    document.querySelector(".champions-button").classList.add("account-selected-button");
    const accountChampions = document.createElement("div");
    accountChampions.textContent = "Champions information about the summoner.";
    document.querySelector(".account-content").replaceChildren(accountChampions);
}

/*
* =================================================================
* ======================DETAILS DISPLAYING=========================
* =================================================================
* */

/**
 * Gets the teams on a certain match, being the first
 * the correspondent to the team with the given id.
 * @param match the match data
 * @param summonerTeamId the summoner team id
 * @return {any} An array with both teams data.
 */
function getTeams(match, summonerTeamId) {
    const teams = match["info"]["teams"];
    if (teams[0]["teamId"] !== summonerTeamId) {
        const temp = teams[0];
        teams[0] = teams[1];
        teams[1] = temp;
    }
    teams[0]["participants"] = [];
    teams[1]["participants"] = [];
    for (const participant of match["info"]["participants"]) {
        if (participant["teamId"] === summonerTeamId) teams[0]["participants"].push(participant);
        else teams[1]["participants"].push(participant);
    }
    return teams;
}

/**
 * Displays the details of a certain match.
 * @param matchDiv the match div
 * @param match the match data
 * @param summonerTeamId the summoner team id
 */
function displayDetails(matchDiv, match, summonerTeamId) {
    const detailsDiv = matchDiv.querySelector(".details-layout");
    const matchDetailsIcon = matchDiv.querySelector(".match-details-icon");
    if (detailsDiv.classList.contains("details-hidden")) {
        matchDetailsIcon.innerHTML = "&#9650;";
        if (detailsDiv.querySelector(".details-content").children.length === 0) {
            displayDetailsOverview(matchDiv, match, summonerTeamId);
        }
    } else {
        matchDetailsIcon.innerHTML = "&#9660";
    }
    detailsDiv.classList.toggle("details-hidden", !detailsDiv.classList.contains("details-hidden"));
}

/**
 * Displays the match overview of a certain match.
 * @param matchLayout the match div
 * @param match the match data
 * @param summonerTeamId the summoner team id
 */
function displayDetailsOverview(matchLayout, match, summonerTeamId) {
    for(const button of matchLayout.querySelectorAll(".details-nav-button")) {
        button.classList.remove("details-selected-button");
    }
    matchLayout.querySelector(".overview-button").classList.add("details-selected-button");
    const teams = getTeams(match, summonerTeamId);
    const overviewFragment = document.querySelector(".overview-template").content.cloneNode(true);
    for (let i = 0; i < teams.length; i++) {
        const objectives = teams[i]["objectives"];
        const turrets = overviewFragment.querySelectorAll(".overview-turrets")[i];
        const dragons = overviewFragment.querySelectorAll(".overview-dragons")[i];
        const barons = overviewFragment.querySelectorAll(".overview-barons")[i];
        const kills = overviewFragment.querySelectorAll(".overview-kills")[i];
        turrets.textContent = objectives["tower"]["kills"];
        dragons.textContent = objectives["dragon"]["kills"];
        barons.textContent = objectives["baron"]["kills"];
        kills.textContent = objectives["champion"]["kills"];
        if (teams[i]["win"]) {
            turrets.classList.add("overview-winner-text");
            dragons.classList.add("overview-winner-text");
            barons.classList.add("overview-winner-text")
            kills.classList.add("overview-winner-text");
        } else {
            turrets.classList.add("overview-loser-text");
            dragons.classList.add("overview-loser-text");
            barons.classList.add("overview-loser-text");
            kills.classList.add("overview-loser-text");
        }
    }
    const teamDivs = overviewFragment.querySelectorAll(".team");
    const participantDivTemplate = document.querySelector(".participant-template").content.firstElementChild;
    for (let i = 0; i < teams.length && i < teamDivs.length; i++) {
        if (teams[i]["win"]) teamDivs[i].classList.add("details-winner-div");
        else teamDivs[i].classList.add("details-loser-div");
        for (const participant of teams[i]["participants"]) {
            const participantDiv = participantDivTemplate.cloneNode(true);
            if (name === participant["summonerName"]) participantDiv.classList.add("highlighted");
            // Participant champ
            const participantChamp = participant["championName"];
            const champImg = participantDiv.querySelector(".participant-champ-img");
            champImg.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${participantChamp}.png`;
            champImg.alt = participantChamp;
            champImg.title = participantChamp;
            // Participant spells
            const spells = getSpells(
                String(participant["summoner1Id"]),
                String(participant["summoner2Id"]));
            const spellsImg = participantDiv.querySelectorAll(".participant-spell-img");
            for (let j = 0; j < spells.length && j < spellsImg.length; j++) {
                spellsImg[j].src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spells[j]}.png`;
                spellsImg[j].alt = spells[j].substr(8);
                spellsImg[j].title = spells[j].substr(8);
            }
            // Participant main data
            const nameLink = participantDiv.querySelector(".participant-link");
            nameLink.textContent = participant["summonerName"];
            nameLink.title = participant["summonerName"];
            nameLink.href = `/${platform}/${participant["summonerName"]}`;
            participantDiv.querySelector(".participant-kda").textContent =
                `${participant["kills"]}/` +
                `${participant["deaths"]}/` +
                `${participant["assists"]}`;
            // Participant secondary data
            participantDiv.querySelector(".participant-farm").textContent =
                `${participant["totalMinionsKilled"] + participant["neutralMinionsKilled"]}`;
            participantDiv.querySelector(".participant-gold").textContent = participant["goldEarned"];
            // Participant items
            const items = [
                participant["item0"],
                participant["item1"],
                participant["item2"],
                participant["item3"],
                participant["item4"],
                participant["item5"],
                participant["item6"]];
            const itemsImg = participantDiv.querySelectorAll(".participant-item-img");
            for (let j = 0; j < items.length && j < itemsImg.length; j++) {
                if (items[j]) {
                    itemsImg[j].src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${items[j]}.png`;
                    itemsImg[j].alt = items[j];
                    itemsImg[j].title = items[j];
                }
            }
            teamDivs[i].appendChild(participantDiv);
        }
    }
    // At the moment if works similar to appendChild with fragments
    matchLayout.querySelector(".details-content").replaceChildren(overviewFragment);
}


/**
 * Displays the match charts of a certain match.
 */
function displayDetailsCharts(matchLayout, match, summonerTeamId) {
    // Details nav styling
    for(const button of matchLayout.querySelectorAll(".details-nav-button")) {
        button.classList.remove("details-selected-button");
    }
    matchLayout.querySelector(".charts-button").classList.add("details-selected-button");
    // Charts fragment from template
    const chartsFragment = document.querySelector(".charts-template").content.cloneNode(true);
    // Chart teams
    const teams = getTeams(match, summonerTeamId);
    const teamDivs = chartsFragment.querySelectorAll(".charts-team");
    const barDivTemplate = document.querySelector(".bar-template").content.firstElementChild;
    for (let i = 0; i < teams.length && i < teamDivs.length; i++) {
        // Team div styling
        if (teams[i]["win"]) teamDivs[i].classList.add("details-winner-div");
        else teamDivs[i].classList.add("details-loser-div");
        for (const participant of teams[i]["participants"]) {
            const barDiv = barDivTemplate.cloneNode(true);
            // Bar div styling
            if (name === participant["summonerName"]) barDiv.classList.add("highlighted");
            // Bar champ
            const barChamp = participant["championName"];
            const barChampImg = barDiv.querySelector(".bar-champ-img");
            barChampImg.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${barChamp}.png`;
            barChampImg.alt = barChamp;
            barChampImg.title = barChamp;
            // Bar data
            barDiv.querySelector(".bar-name").textContent = participant["summonerName"];
            const barValue = barDiv.querySelector(".bar-value");
            barValue.textContent = "?";
            participant["barValue"] = barValue;
            // Bar progress
            const barProgress = barDiv.querySelector(".progress");
            barProgress.style.width = "1em";
            if (participant["win"]) barProgress.classList.add("winner-progress");
            else barProgress.classList.add("loser-progress");
            participant["barProgress"] = barProgress;
            // Append bar to team
            teamDivs[i].appendChild(barDiv);
        }
    }
    matchLayout.querySelector(".details-content").replaceChildren(chartsFragment);
    displayChart(matchLayout, teams, "totalDamageDealtToChampions");
    // Chart select
    const chartsSelect = matchLayout.querySelector(".charts-select");
    chartsSelect.addEventListener("change", () => {
        const detailsCharts = matchLayout.querySelector(".details-charts");
        displayChart(detailsCharts, teams, chartsSelect.value);
    });
}

function getMaxMatchValue(teams, valueKey) {
    let maxValue = 0;
    for (let i = 0; i < teams.length; i++) {
        for (const participant of teams[i]["participants"]) {
            if (participant[valueKey] > maxValue) {
                maxValue = participant[valueKey];
            }
        }
    }
    return maxValue > 0 ? maxValue : 1;
}

function displayChart(detailsCharts, teams, valueKey) {
    const maxValue = getMaxMatchValue(teams, valueKey);
    for (let i = 0; i < teams.length; i++) {
        for (const participant of teams[i]["participants"]) {
            const value = participant[valueKey];
            // Bar data
            participant["barValue"].textContent = value
            // Bar progress
            participant["barProgress"].style.width = `max(calc(${100 * value / maxValue}% - 5em), 1%)`;
        }
    }
}
