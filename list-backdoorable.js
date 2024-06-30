/**
 * Lists servers that need backdoors installed and provides paths to manually connect.
 * @param {NS} ns
 **/
export async function main(ns) {
    const allServers = await findAllServers(ns);
    const serversNeedingBackdoor = [];

    for (const server of allServers) {
        if (server !== "home" && ns.hasRootAccess(server) && !ns.getServer(server).backdoorInstalled) {
            const path = findPathToServer(ns, server);
            serversNeedingBackdoor.push({ server, path });
        }
    }

    if (serversNeedingBackdoor.length > 0) {
        ns.tprint("The following servers need backdoors and their respective paths:");
        for (const { server, path } of serversNeedingBackdoor) {
            ns.tprint(`- ${server}: ${path.join(' -> ')}`);
            ns.tprint(`Command: connect ${path.join('; connect ')}; backdoor`);
        }
    } else {
        ns.tprint("All accessible servers have backdoors installed.");
    }
}

/**
 * Finds and returns an array of all servers.
 */
async function findAllServers(ns) {
    const serverDiscovered = { "home": true };
    const queue = ["home"];
    const serverPaths = { "home": [] };

    while (queue.length) {
        const currentServer = queue.shift();
        for (const neighbor of ns.scan(currentServer)) {
            if (!serverDiscovered[neighbor]) {
                serverDiscovered[neighbor] = true;
                queue.push(neighbor);
                serverPaths[neighbor] = [...serverPaths[currentServer], currentServer];
            }
        }
    }

    return Object.keys(serverDiscovered);
}

/**
 * Finds the path from 'home' to the specified server.
 * @param {NS} ns
 * @param {string} targetServer - The server to find the path to.
 * @returns {string[]} - The path from 'home' to the target server.
 */
function findPathToServer(ns, targetServer) {
    const serverPaths = { "home": [] };
    const queue = ["home"];

    while (queue.length) {
        const currentServer = queue.shift();
        for (const neighbor of ns.scan(currentServer)) {
            if (!serverPaths[neighbor]) {
                serverPaths[neighbor] = [...serverPaths[currentServer], currentServer];
                queue.push(neighbor);

                if (neighbor === targetServer) {
                    return [...serverPaths[neighbor], neighbor];
                }
            }
        }
    }

    return [];
}
