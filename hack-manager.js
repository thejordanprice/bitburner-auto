/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * !! Only run from home server !!
 * @param {NS} ns
 **/
export async function main(ns) {
    while (true) {
        const allServers = await findAllServers(ns);  // Finds all servers and clones grow, hack, and weaken files to them.
        const [hackableServers, rootableServers, optimalServer] = await findHackable(ns, allServers); // Finds and nukes optimal, hackable, and rootable servers.

        const target = optimalServer;
        const moneyThresh = ns.getServerMaxMoney(target) * 0.90; // 90% threshold for money.
        const securityThresh = ns.getServerMinSecurityLevel(target) + 5; // Security threshold.

        const numTimesToHack = 2.05; // Number of times to hack/grow/weaken in a row.
        const sleepTime = numTimesToHack * 300; // Sleep time adjustment.

        // Main hacking loop, runs actions based on server state.
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await performAction(ns, rootableServers, "w1.js", target, securityThresh, numTimesToHack, 'weaken', ns.getWeakenTime(target) + sleepTime);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await performAction(ns, rootableServers, "g1.js", target, securityThresh, numTimesToHack, 'grow', ns.getGrowTime(target) + sleepTime);
        } else {
            await performAction(ns, rootableServers, "h1.js", target, securityThresh, numTimesToHack, 'hack', ns.getHackTime(target) + sleepTime);
        }
    }
}

/**
 * Perform the hacking action (weaken/grow/hack) on a server.
 */
async function performAction(ns, servers, script, target, securityThresh, numTimesToHack, actionType, waitTime) {
    for (const server of servers) {
        ns.killall(server); // Kill all running scripts on the server.
        let numThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script, "home"));
        if (numThreads > 0) {
            ns.exec(script, server, numThreads, target);
        }
    }
    await printServerDetails(ns, target, securityThresh, numTimesToHack, actionType);
    await ns.sleep(waitTime);
}

/**
 * Copies files in file list to all servers and returns an array of all servers.
 */
async function findAllServers(ns) {
    const fileList = ["w1.js", "g1.js", "h1.js"]; // Scripts for weaken, grow, and hack.
    const serverDiscovered = { "home": true };
    const queue = ["home"];

    while (queue.length) {
        const currentServer = queue.shift();
        for (const neighbor of ns.scan(currentServer)) {
            if (!serverDiscovered[neighbor]) {
                serverDiscovered[neighbor] = true;
                queue.push(neighbor);
                await ns.scp(fileList, neighbor, "home");
            }
        }
    }
    return Object.keys(serverDiscovered);
}

/**
 * Finds list of all hackable and all rootable servers, and the optimal server to hack.
 */
async function findHackable(ns, allServers) {
    const hackableServers = [];
    const rootableServers = [];
    const numPortsPossible = countAvailablePorts(ns);

    for (const server of allServers) {
        if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server) && numPortsPossible >= ns.getServerNumPortsRequired(server)) {
            hackableServers.push(server);
        }
        if (server !== "home" && (ns.hasRootAccess(server) || numPortsPossible >= ns.getServerNumPortsRequired(server))) {
            rootableServers.push(server);
            if (!ns.hasRootAccess(server)) {
                await openPortsAndNuke(ns, server);
            }
        }
    }

    const optimalServer = await findOptimal(ns, hackableServers);
    return [hackableServers, rootableServers, optimalServer];
}

/**
 * Counts the number of available port-opening programs.
 */
function countAvailablePorts(ns) {
    const portPrograms = ["BruteSSH.exe", "FTPCrack.exe", "RelaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    return portPrograms.reduce((count, program) => ns.fileExists(program, "home") ? count + 1 : count, 0);
}

/**
 * Opens necessary ports and nukes the server.
 */
async function openPortsAndNuke(ns, server) {
    if (ns.fileExists("BruteSSH.exe")) ns.brutessh(server);
    if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(server);
    if (ns.fileExists("RelaySMTP.exe")) ns.relaysmtp(server);
    if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(server);
    if (ns.fileExists("SQLInject.exe")) ns.sqlinject(server);
    ns.nuke(server);
}

/**
 * Finds the best server to hack based on money and time.
 */
async function findOptimal(ns, hackableServers) {
    let optimalServer = "n00dles";
    let optimalVal = 0;

    for (const server of hackableServers) {
        const value = ns.getServerMaxMoney(server) / (ns.getWeakenTime(server) + ns.getGrowTime(server) + ns.getHackTime(server));
        if (value > optimalVal) {
            optimalVal = value;
            optimalServer = server;
        }
    }
    return optimalServer;
}

/**
 * Prints the current state of a server.
 */
async function printServerDetails(ns, host, securityThresh, numTimesToHack, hackType) {
    const moneyCurrent = ns.getServerMoneyAvailable(host);
    const moneyMax = ns.getServerMaxMoney(host);
    const moneyPerc = Math.floor((moneyCurrent / moneyMax) * 100);

    const dollarUS = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const moneyCurrentFormatted = dollarUS.format(moneyCurrent);
    const moneyMaxFormatted = dollarUS.format(moneyMax);
    const homeMoneyFormatted = dollarUS.format(ns.getServerMoneyAvailable("home"));

    const serverSecurity = ns.getServerSecurityLevel(host);
    const minSecurity = ns.getServerMinSecurityLevel(host);

    const workTime = (hackType === "hack" ? ns.getHackTime(host) : hackType === "grow" ? ns.getGrowTime(host) : ns.getWeakenTime(host)) / 1000;

    ns.tprint(`
        [${hackType.toUpperCase()}ING... @ ${host}]
        - Security: ${serverSecurity} [Min: ${minSecurity}, Threshold: ${securityThresh}]
        - Server's Money: ${moneyCurrentFormatted} out of ${moneyMaxFormatted} (${moneyPerc}%)
        => My Money: ${homeMoneyFormatted}
        [Estimated seconds to next action: ${Math.floor(workTime * numTimesToHack + 0.3)}]
    `);
}
