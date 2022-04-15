let language;

/*
=======================================
========== Riot API requests ==========
=======================================
 */

let matchesIDs = [];

/**
 * Requests the summoner data to the Riot API.
 * @param platform The summoner {@link https://developer.riotgames.com/docs/lol platform}.
 * @param name The summoner name.
 * @param key The Riot API {@link https://developer.riotgames.com/docs/portal#web-apis key}.
 * @return {Promise<any>} A {@link Promise}
 */
async function requestSummoner(platform, name, key) {
    const summonerURL = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?`+
        `api_key=${key}`;
    return await fetchJSON(summonerURL);
}


/**
 * Requests the summoner 10 most recent matches data, starting from {@link startIndex}.
 * @param region The summoner {@link https://developer.riotgames.com/docs/lol region}.
 * @param puuid The summoner {@link https://riot-api-libraries.readthedocs.io/en/latest/ids.html puuid}.
 * @param startIndex The first match index (0 as default).
 * @param key The Riot API {@link https://developer.riotgames.com/docs/portal#web-apis key}.
 * @return {Promise<any[]>} A {@link Promise}
 */
async function requestMatches(region, puuid, startIndex = 0, key) {
    const matchesIDsURL = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?`+
        `start=${startIndex}&count=10&api_key=${key}`;
    const matchesIDsJSON = await fetchJSON(matchesIDsURL);
    const matchesJSONsFetches = [];
    for (const matchID of matchesIDsJSON) {
        matchesIDs.push(matchID);
        const matchURL = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchID}?`+
            `api_key=${key}`;
        matchesJSONsFetches.push(fetchJSON(matchURL));
    }
    return await Promise.all(matchesJSONsFetches);
}

/**
 * Request the summoner champion masteries to the Riot API.
 * @param platform The summoner {@link https://developer.riotgames.com/docs/lol platform}.
 * @param summonerId The summoner id.
 * @param key The Riot API {@link https://developer.riotgames.com/docs/portal#web-apis key}.
 * @return {Promise<any>} A {@link Promise}
 */
async function requestMasteries(platform, summonerId, key) {
    const masteriesURL = `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}?api_key=${key}`;
    return await fetchJSON(masteriesURL);
}

/*
==============================================
========== Data Dragon API requests ==========
==============================================
 */

let version;
let championsDData;
let spellsDData;

/**
 * Requests the current League of Legends version to the Data Dragon API.
 * @return {Promise<any>} A {@link Promise} that resolves in an array with
 * all the versions in string format.
 */
async function requestVersions() {
    try {
        const versionsURL = "https://ddragon.leagueoflegends.com/api/versions.json";
        return await fetchJSON(versionsURL);
    } catch (error) {
        throw new Error("Error trying to fetch versions data.");
    }
}

/**
 * Requests the champions' data to the Data Dragon API.
 * @return {Promise<any>} A {@link Promise}
 */
async function requestChampions() {
    try {
        const championsURL = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/champion.json`;
        return await fetchJSON(championsURL);
    } catch (error) {
        throw new Error("Error trying to fetch champions data.");
    }
}


/**
 * Requests the spells' data to the Data Dragon API.
 * @return {Promise<any>} A {@link Promise}
 */
async function requestSpells() {
    try {
        const spellsURL = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/summoner.json`;
        return await fetchJSON(spellsURL);
    } catch (error) {
        throw new Error("Error trying to fetch spells data.");
    }
}

