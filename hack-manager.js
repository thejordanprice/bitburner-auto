/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * !! Only run from home server !!
 * @param {NS} ns **/
export async function main(ns) {
    while (true) {
        var allServers = await findAllServers(ns);  // finds all servers and clones grow, hack, and weaken files to them
        var multiarray = await findHackable(ns, allServers);    // finds and nukes optimal, hackable, and rootale servers
        var hackableServers = multiarray[0]; // Not used in this function, ignore
        var rootableServers = multiarray[1];
        var optimalServer = multiarray[2];

        var target = optimalServer;

        // Threshold to stop growing a server, a % of total money on server.
        // 0.90 means the script will grow the server until it has at least 90% of its total wealth.
        // Lower this if the script spends all of its time growing.
        // Increase for more efficiency, but with fewer updates in terminal.
        var moneyThresh = ns.getServerMaxMoney(target) * 0.90;

        // Threshold for the minimum security level you want before hacking.
        // Default is 5. Increase this if you seem to always be weakening and not hacking.
        // Once the security level reaches the threshold, it will weaken the server
        var securityThresh = ns.getServerMinSecurityLevel(target) + 5;

        let numThreads = 1;
        var numTimesToHack = 0.05; // Don't touch this

        // Number of times the code weakens/grows/hacks in a row once it decides on which one to do.
        // Higher this number is the more efficient the extraction.
        // Lowering this number will give you an update more quickly, but some efficiency is lost.
        // Minimum 1
        numTimesToHack += 2;

        //weakens/grows/hacks the optimal server from all rootable servers except home
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i])) //free ram
                numThreads /= ns.getScriptRam("w1.js", "home");
                numThreads = Math.floor(numThreads);
                if (numThreads > 0) {
                    ns.exec("w1.js", rootableServers[i], numThreads, target);
                }
            }
            await printServerDetails(ns, target, securityThresh, numTimesToHack, 'weaken');
            await ns.sleep(numTimesToHack * ns.getWeakenTime(target) + 300);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= ns.getScriptRam("g1.js", "home");
                if (numThreads > 0) {
                    ns.exec("g1.js", rootableServers[i], numThreads, target);
                }
            }
            await printServerDetails(ns, target, securityThresh, numTimesToHack, 'grow');
            await ns.sleep(numTimesToHack * ns.getGrowTime(target) + 300);
        } else {
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= ns.getScriptRam("h1.js", "home");
                if (numThreads > 0) {
                    ns.exec("h1.js", rootableServers[i], numThreads, target);
                }
            }
            await printServerDetails(ns, target, securityThresh, numTimesToHack, 'hack');
            await ns.sleep(numTimesToHack * ns.getHackTime(target) + 300);
        }
    }

}

/**
* Copies files in file list to all servers and returns an array of all servers
*/
async function findAllServers(ns) {
    const fileList = ["w1.js", "g1.js", "h1.js"];   //These files just infinitely hack, weaken, and grow respectively.
    var q = [];
    var serverDiscovered = [];

    q.push("home");
    serverDiscovered["home"] = true;

    while (q.length) {
        let v = q.shift();

        let edges = ns.scan(v);

        for (let i = 0; i < edges.length; i++) {
            if (!serverDiscovered[edges[i]]) {
                serverDiscovered[edges[i]] = true;
                q.push(edges[i]);
                await ns.scp(fileList, edges[i], "home");
            }
        }
    }
    return Object.keys(serverDiscovered);
}

/**
* Finds list of all hackable and all rootable servers. Also finds optimal server to hack.
* A hackable server is one which you can hack, grow, and weaken.
* A rootable server is one which you can nuke.
* Returns a 2d array with list of hackable, rootable, and the optimal server to hack
*/
async function findHackable(ns, allServers) {
    var hackableServers = [];
    var rootableServers = [];
    var numPortsPossible = 0;

    if (ns.fileExists("BruteSSH.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("FTPCrack.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("RelaySMTP.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("HTTPWorm.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("SQLInject.exe", "home")) {
        numPortsPossible += 1;
    }


    for (let i = 0; i < allServers.length; i++) {
        //if your hacking level is high enough and you can open enough ports, add it to hackable servers list
        if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(allServers[i]) && numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])) {
            hackableServers.push(allServers[i]);
        }
        //if it isn't home(this makes sure that you don't kill this script) and you either
        //already have root access(this is useful for servers bought by the player as you have access to those even if the security is higher than you can nuke)
        //  or you can open enough ports
        if (allServers[i] != "home" && (ns.hasRootAccess(allServers[i]) || (numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])))) {
            rootableServers.push(allServers[i]);
            //if you don't have root access, open ports and nuke it
            if (!ns.hasRootAccess(allServers[i])) {
                if (ns.fileExists("BruteSSH.exe")) {
                    ns.brutessh(allServers[i]);
                }
                if (ns.fileExists("FTPCrack.exe")) {
                    ns.ftpcrack(allServers[i]);
                }
                if (ns.fileExists("RelaySMTP.exe")) {
                    ns.relaysmtp(allServers[i]);
                }
                if (ns.fileExists("HTTPWorm.exe")) {
                    ns.httpworm(allServers[i]);
                }
                if (ns.fileExists("SQLInject.exe")) {
                    ns.sqlinject(allServers[i]);
                }
                ns.nuke(allServers[i]);
            }
        }
    }

    //finds optimal server to hack
    let optimalServer = await findOptimal(ns, hackableServers);

    return [hackableServers, rootableServers, optimalServer];
}

/**
 * Finds the best server to hack.
 * The algorithm works by assigning a value to each server and returning the max value server.
 * The value is the serverMaxMoney divided by the sum of the server's weaken time, grow time, and hack time.
 * You can easily change this function to choose a server based on whatever optimizing algorithm you want,
 *  just return the server name to hack.
*/
async function findOptimal(ns, hackableServers) {
    let optimalServer = "n00dles";
    let optimalVal = 0;
    let currVal;
    let currTime;

    for (let i = 0; i < hackableServers.length; i++) {
        currVal = ns.getServerMaxMoney(hackableServers[i]);
        currTime = ns.getWeakenTime(hackableServers[i]) + ns.getGrowTime(hackableServers[i]) + ns.getHackTime(hackableServers[i]);
        currVal /= currTime;
        if (currVal >= optimalVal) {
            optimalVal = currVal;
            optimalServer = hackableServers[i];
        }
    }

    return optimalServer;
}

/**
 * Prints the current state of a server
*/
async function printServerDetails(ns, host, securityThresh, numTimesToHack, hackType) {
    const moneyCurrent = Math.floor(ns.getServerMoneyAvailable(host));
    const moneyMax = Math.floor(ns.getServerMaxMoney(host));
    const moneyPerc = Math.floor((moneyCurrent / moneyMax * 100));

    let dollarUS = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const newCur = dollarUS.format(moneyCurrent);
    const newMax = dollarUS.format(moneyMax);
    const curMoney = dollarUS.format(ns.getServerMoneyAvailable("home"));

    const servSec = Math.floor(ns.getServerSecurityLevel(host));
    const servMaxSec = Math.floor(ns.getServerMinSecurityLevel(host));

    let workTime = 0;
    let workType = "NONE";

    if (hackType == "hack") {
        workTime = ns.getHackTime(host);
        workType = "\n\n [HACKING... @ ";
    } else if (hackType == "grow") {
        workTime = ns.getGrowTime(host);
        workType = "\n\n [GROWING... @ ";
    } else if (hackType == "weaken") {
        workTime = ns.getWeakenTime(host);
        workType = "\n\n [WEAKENING... @ ";
    } else {
        ns.tprint("Incorrect hackType in getServerDetails. Only hack, grow, and weaken are allowed. Ending script.");
        return;
    }

    var output = "\n  - Security: " + servSec + "  [Minimum: " + servMaxSec + ", Threshold: " + securityThresh + "]";
    output += "\n";
    output += "  - Server's Money: " + newCur + " out of " + newMax + " (" + moneyPerc + "%)";
    output += "\n";
    output += "  => My Money: " + curMoney;
    output += "\n";
    output += " [Estimated seconds to next action: " + Math.floor((numTimesToHack * workTime + 300) / 1000) + "]\n\n";

    ns.tprint(workType + host + "]" + output);

    return;
}
