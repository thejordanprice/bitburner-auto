/**
 * Lists servers that need backdoors installed.
 * @param {NS} ns
 **/
export async function main(ns) {
    // Get the list of all servers
    const allServers = await findAllServers(ns);
    
    // Check each server and print those that need a backdoor
    const serversNeedingBackdoor = [];
    for (const server of allServers) {
        if (server !== "home" && ns.hasRootAccess(server) && !ns.getServer(server).backdoorInstalled) {
            serversNeedingBackdoor.push(server);
        }
    }

    if (serversNeedingBackdoor.length > 0) {
        ns.tprint("The following servers need backdoors:");
        for (const server of serversNeedingBackdoor) {
            ns.tprint(`- ${server}`);
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

    while (queue.length) {
        const currentServer = queue.shift();
        for (const neighbor of ns.scan(currentServer)) {
            if (!serverDiscovered[neighbor]) {
                serverDiscovered[neighbor] = true;
                queue.push(neighbor);
            }
        }
    }
    return Object.keys(serverDiscovered);
}
