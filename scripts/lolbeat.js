const ownerName = "Juan Flores";
const ownerEmail= "juanintendo.f11@gmail.com";

/**
 *
 * @return {string}
 */
String.prototype.toHHMMSS = function () {
    const totalSeconds = parseInt(this, 10); // don't forget the second param
    let hours   = String(Math.floor(totalSeconds / 3600));
    let minutes = String(Math.floor((totalSeconds - (hours * 3600)) / 60));
    let seconds = String(totalSeconds - (hours * 3600) - (minutes * 60));

    if (Number(hours)   < 10) hours   = "0" + hours;
    if (Number(minutes) < 10) minutes = "0" + minutes;
    if (Number(seconds) < 10) seconds = "0" + seconds;
    return hours === "00" ? minutes + ":" + seconds : hours + ":" + minutes+ ":" +seconds;
}

/**
 *
 * @param resource
 * @return {Promise<any>} A {@link Promise}
 */
async function fetchJSON(resource) {
    const response = await fetch(resource);
    if (!response.ok) {
        throw new Error(`HTTP error, status: ${response.status}`);
    }
    return await response.json();
}


